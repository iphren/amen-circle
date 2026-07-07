# TODO

## Post-migration cleanup — around 21 July 2026 (after 2-week soak)

The Amplify → EC2 cutover completed on 7 July 2026. Once two quiet weeks
confirm the new stack, decommission the old one:

- [ ] Take a final archive dump of the Neon database, then delete the Neon
      project.
- [ ] Terraform: remove `aws_amplify_app`, `aws_amplify_branch`, the Amplify
      IAM role + policy, and the `github-access-token` SSM data source; drop
      the Amplify outputs from `infra/outputs.tf`; delete `amplify.yml`.
- [ ] Delete stale SSM parameters: `/amen-circle/database-url`,
      `/amen-circle/database-url-direct`, `/amen-circle/github-access-token`.
- [ ] Strip the Amplify `runtime-env.json` shim from
      `src/instrumentation-node.ts` (dead code since the move to Docker).
- [ ] Bump dev `docker-compose.yml` to `postgres:17` for parity with prod.

## Sooner — around 10 July 2026

- [ ] Delete the old unencrypted EBS volume AND both snapshots from the
      7 July encryption swap (the unencrypted copies defeat the purpose).
- [ ] Confirm the first nightly backups landed:
      `aws s3 ls s3://<backup bucket>/db/`
