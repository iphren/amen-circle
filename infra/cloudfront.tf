# CloudFront in front of the self-hosted EC2 origin (Docker Compose app behind
# the server's shared nginx). TLS terminates here; the origin is plain HTTP on
# port 80, authenticated by the X-Origin-Verify custom header that nginx checks.
#
# CUTOVER NOTE: CloudFront CNAMEs are globally unique, so the domain aliases
# below could only be added in the same apply that deleted the Amplify domain
# associations (see the cutover comment in main.tf). Applying this config
# BEFORE the cutover window will start the cutover — the aliases and the
# Route53 changes in main.tf go live together.

# Stable name for the EC2 origin, so the distribution never has to track IP
# or AWS-generated hostnames. Created only when origin_server_ip is set;
# CloudFront forwards the viewer's Host header, so nginx never sees (and does
# not need a server_name for) this hostname.
resource "aws_route53_record" "origin" {
  count   = var.origin_server_ip == "" ? 0 : 1
  zone_id = data.aws_route53_zone.root.zone_id
  name    = "origin.${var.domain_name}"
  type    = "A"
  ttl     = 300
  records = [var.origin_server_ip]
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

# Forwards ALL viewer headers — including Host — to the origin. nginx on the
# shared server routes by server_name, so the viewer Host header must survive.
# (AllViewerExceptHostHeader would make nginx see the EC2 hostname and miss
# the vhost.)
data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}

# Host-based 301s to the apex, replacing the Amplify custom_rule redirects.
# Matches only the known alternate hosts (not `host != apex`) so the
# dxxxx.cloudfront.net hostname keeps working for pre-cutover testing.
resource "aws_cloudfront_function" "canonical_host" {
  name    = "${var.app_name}-canonical-host"
  runtime = "cloudfront-js-2.0"
  comment = "301 www + legacy hosts to https://${var.domain_name}"
  publish = true

  code = <<-EOT
    function handler(event) {
      var request = event.request;
      var host = request.headers.host.value;
      if (host !== "www.${var.domain_name}" && host !== "${var.legacy_domain_name}") {
        return request;
      }
      var qs = [];
      for (var key in request.querystring) {
        var entry = request.querystring[key];
        if (entry.multiValue) {
          for (var i = 0; i < entry.multiValue.length; i++) {
            qs.push(key + "=" + entry.multiValue[i].value);
          }
        } else if (entry.value === "") {
          qs.push(key);
        } else {
          qs.push(key + "=" + entry.value);
        }
      }
      var location = "https://${var.domain_name}" + request.uri + (qs.length ? "?" + qs.join("&") : "");
      return {
        statusCode: 301,
        statusDescription: "Moved Permanently",
        headers: { location: { value: location } },
      };
    }
  EOT
}

resource "aws_cloudfront_distribution" "main" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.app_name} app (EC2 origin)"
  # NA + EU edges only — the audience is UK-centric and this halves the cost.
  price_class = "PriceClass_100"

  aliases = [var.domain_name, "www.${var.domain_name}"]

  origin {
    origin_id   = "ec2-nginx"
    domain_name = var.origin_server_domain

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-Origin-Verify"
      value = data.aws_ssm_parameter.origin_verify_secret.value
    }
  }

  default_cache_behavior {
    target_origin_id         = "ec2-nginx"
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.canonical_host.arn
    }
  }

  # Immutable content-hashed assets (Next sets public,max-age=31536000,immutable);
  # cache these at the edge even though everything else is pass-through.
  ordered_cache_behavior {
    path_pattern             = "/_next/static/*"
    target_origin_id         = "ec2-nginx"
    allowed_methods          = ["GET", "HEAD"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_optimized.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.main.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = local.common_tags
}

# amen.ihs.technology needs its own distribution because a distribution can
# carry only one ACM certificate and the main one already uses the
# amencircle.com cert. The viewer-request function 301s every request for the
# legacy host before any origin fetch, so the origin below is never contacted.
resource "aws_cloudfront_distribution" "legacy_redirect" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.app_name} legacy-domain redirect"
  price_class     = "PriceClass_100"

  aliases = [var.legacy_domain_name]

  origin {
    origin_id   = "redirect-dummy"
    domain_name = var.domain_name

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "redirect-dummy"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_disabled.id
    viewer_protocol_policy = "redirect-to-https"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.canonical_host.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.legacy_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = local.common_tags
}
