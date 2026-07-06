import type { Dictionary } from "@/lib/i18n/dictionaries/en-GB";
import type { DeepPartial } from "@/lib/i18n/types";

// 简体中文 translations. Keep the shape in sync with en-GB.ts; omitted or blank
// strings fall back to English.
export const zhCN: DeepPartial<Dictionary> = {
  common: {
    appName: "同心圆",
    tagline: "同心祷告，彼此守望。",
    backToSignIn: "返回登录",
    backToDashboard: "返回主页",
    goHome: "回到首页",
    requestNewLink: "重新请求链接",
    emailLabel: "邮箱",
    emailPlaceholder: "you@example.com",
    genericError: "出了点问题。",
    failed: "失败",
    cancel: "取消",
    confirm: "确认",
  },

  metadata: {
    defaultTitle: "同心圆",
    titleTemplate: "%s · 同心圆",
    description:
      "同心祷告，彼此守望。同心圆能够帮助你创建祷告房间，分享代祷事项，并彼此代祷。祷告的内容会被加密保存，只有分配到的人才能看到。每人只会知道自己要为谁代祷，而不会知道谁在为自己祷告。将一切荣耀归于神。",
    signInTitle: "登录",
    emailLoginTitle: "使用邮箱登录",
    recoverTitle: "找回账号",
    joinTitle: "加入祷告房间",
    roomsTitle: "祷告房间",
    myPrayersTitle: "我的代祷",
    settingsTitle: "设置",
    roomFallbackTitle: "祷告房间",
    privacyTitle: "隐私政策",
    privacyDescription: "同心圆如何收集、使用并保护你的数据。",
    termsTitle: "服务条款",
    termsDescription: "规范你使用同心圆的服务条款。",
  },

  nav: {
    dashboard: "主页",
    myPrayers: "我的代祷",
    settings: "设置",
    signOut: "退出登录",
    signingOut: "正在退出…",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
  },

  footer: {
    privacy: "隐私",
    terms: "条款",
    contact: "联系 / 举报内容",
    languageLabel: "语言",
  },

  landing: {
    register: "注册",
    signIn: "登录",
    prayerRulesTitle: "祷告规则",
    prayerRules: [
      "邀请你信任、愿意彼此守望的人。",
      "每人写下一件想被代祷的事项。",
      "每个代祷事项会交给另一位成员守望。",
      "不要告诉别人你在为谁代祷。",
      "你也不会知道谁在为你祷告。",
      "分享你的见证。",
      "将一切荣耀归于神。",
    ],
  },

  auth: {
    createTitle: "创建你的通行密钥",
    signInTitle: "使用通行密钥登录",
    createDescription: "我们会在这台设备上保存通行密钥，无需密码。",
    signInDescription: "选择你要使用的账号对应的通行密钥。",
    displayNameLabel: "显示名称",
    displayNamePlaceholder: "其他人看到你的名字",
    creatingPasskey: "正在创建通行密钥…",
    createPasskey: "创建通行密钥",
    waitingForPasskey: "正在等待通行密钥…",
    continueWithPasskey: "使用通行密钥继续",
    haveAccount: "已有账号？登录",
    newHere: "第一次来？注册",
    troublePasskey: "通行密钥有问题？给我发送邮箱登录链接",
    lostDevice: "设备丢失了？",
    errors: {
      couldNotStartRegistration: "无法开始注册",
      registrationVerificationFailed: "注册验证失败",
      registrationFailed: "注册失败",
      couldNotStartSignIn: "无法开始登录",
      signInFailed: "登录失败",
    },
  },

  emailLogin: {
    title: "使用邮箱链接登录",
    checkInbox: "请查看你的收件箱。",
    prompt:
      "通行密钥有问题？输入你的邮箱，我们会发送一个登录链接给你。",
    sentNote:
      "如果 {email} 对应的账号存在，我们已经发送了登录链接。链接将在 15 分钟后过期，且只能使用一次。",
    sending: "正在发送…",
    sendLink: "发送登录链接",
    confirmTitle: "登录同心圆",
    confirmDescription: "点击下方按钮，在这台设备上完成登录。",
    signingIn: "正在登录…",
    signIn: "登录",
    invalidLink: "这个登录链接无效或已过期。",
  },

  recover: {
    title: "找回你的账号",
    checkInbox: "请查看你的收件箱。",
    prompt:
      "丢失了保存通行密钥的设备？输入你的邮箱，我们会发送一个账号找回链接给你。",
    sentNote:
      "如果 {email} 对应的账号存在，我们已经发送了账号找回链接。链接将在 20 分钟后过期。设置新的通行密钥会移除账号中的旧通行密钥。",
    sending: "正在发送…",
    sendLink: "发送找回链接",
    enrollTitle: "设置新的通行密钥",
    enrollDescription:
      "这一步会完成账号找回。你的旧通行密钥会被移除，并替换为这台设备上的新通行密钥。",
    settingUp: "正在设置…",
    createNewPasskey: "创建新的通行密钥",
    invalidLink: "这个找回链接无效或已过期。",
    couldNotSetup: "无法设置新的通行密钥",
    recoveryFailed: "账号找回失败",
  },

  consent: {
    terms:
      "我已**年满 18 岁**，并接受[服务条款](/terms)和[隐私政策](/privacy)。",
    religious:
      "我明确同意同心圆存储并处理我写下的代祷事项，其中可能透露我的宗教信仰。我可以随时通过删除这些事项或删除账号来撤回同意。",
    gateTitle: "继续之前",
    gateDescription:
      "我们新增了隐私政策和服务条款。由于代祷事项可能透露你的宗教信仰，我们需要你的明确同意，才能继续保存这些内容。",
    agreeAndContinue: "同意并继续",
    saving: "正在保存…",
    gateFootnote: "如果你不同意，可以在设置中删除你的账号和数据。",
    couldNotSave: "无法保存你的同意",
  },

  dashboard: {
    startOrJoinTitle: "创建或加入祷告房间",
    startOrJoinDescription:
      "输入 6 位房间号加入别人的祷告房间，或输入一个名称来创建自己的祷告房间。",
    roomInputLabel: "房间号或名称",
    roomInputPlaceholder: "房间号（如 ABC234）或名称…",
    joining: "正在加入…",
    joinRoom: "加入祷告房间",
    creating: "正在创建…",
    createRoom: "创建祷告房间",
    hintLooksLikeCode: "看起来像房间号，会加入对应的祷告房间。",
    hintNotACode: "这不是房间号，会用这个名称创建新的祷告房间。",
    hintEmpty: "输入房间号来加入祷告房间，或输入名称来创建祷告房间。",
    couldNotCreateRoom: "无法创建祷告房间",
    couldNotJoin: "无法加入",
    yourRooms: "你的祷告房间",
    noRooms:
      "你还没有加入任何祷告房间。可以在上方创建一个，或用房间号加入。",
    roomMeta: "房间号 {code} · {count} 位成员",
    youOwnThis: " · 由你创建",
    created: "创建于 {date}",
  },

  join: {
    title: "加入祷告房间",
    invitedDescription: "你被邀请加入这个祷告房间。",
    signInDescription: "请登录后加入这个祷告房间。",
    roomCodeLabel: "房间号",
    joining: "正在加入…",
    joinRoom: "加入祷告房间",
    signInToJoin: "登录并加入",
    newHereRegister: "第一次来？注册",
    invalidTitle: "链接无效",
    invalidDescription: "这个邀请链接缺少房间号，或房间号无效。",
    couldNotJoin: "无法加入",
  },

  myPrayers: {
    title: "我的代祷",
    receivedSubtitle: "你在所有祷告房间里被托付的代祷事项。",
    sentSubtitle: "你在各个祷告房间里分享的代祷事项。",
    tabsLabel: "我的代祷标签页",
    tabReceived: "收到的",
    tabSent: "发出的",
    receivedEmpty:
      "这里还没有内容。你所在的祷告房间关闭后，分配给你的代祷事项会显示在这里。",
    sentEmpty:
      "这里还没有内容。在某个祷告房间里分享代祷事项后，它会显示在这里。",
    prayerAnswered: "祷告已蒙应允",
    confidential: "保密",
    fromLabel: "来自",
    report: "举报",
    reportSubject: "举报内容：代祷事项 {id}",
    delete: "删除",
    moreActions: "更多操作",
    undo: "撤销",
    deleteConfirmTitle: "删除这个代祷事项？",
    deleteConfirmDescription:
      "这会永久删除它，包括从所有为它代祷的人那里移除。此操作无法撤销。",
    deleteConfirmText: "删除",
    couldNotUpdate: "无法更新你的代祷事项",
    couldNotDelete: "无法删除你的代祷事项",
  },

  room: {
    notMemberTitle: "你还不是成员",
    notMemberDescription: "请房主把房间号分享给你。",
    roomMeta: "房间号 {code} · {count} 位成员",
    membersTitle: "成员",
    membersSubmitted: "已提交 {submitted}/{total}",
    you: "（你）",
    ownerTag: "· 房主",
    submitted: "✓ 已提交",
    waiting: "等待中",
    ownerLabel: "房主",
    remove: "移除",
    removeConfirmTitle: "移除 {name}？",
    removeConfirmDescription:
      "这个人会被移出祷告房间，并且其在这里分享的代祷事项也会被删除。",
    removeConfirmText: "移除",
    couldNotRemoveMember: "无法移除成员",
    share: "复制链接",
    shareCopied: "已复制！",
    closedTitle: "祷告房间已关闭",
    closedDescription:
      "代祷事项已经分配好了。去“我的代祷”看看你要为谁守望。",
    goToMyPrayers: "前往我的代祷",
    yourRequestTitle: "你的代祷事项",
    yourRequestUpdateDescription: "祷告房间关闭前，你随时可以更新它。",
    yourRequestNewDescription:
      "写下你心里的代祷事项，需要的话稍后还可以修改。",
    requestLabel: "代祷事项",
    requestPlaceholder: "写下你的代祷事项…",
    confidentialRequestPlaceholder:
      "（你之前的代祷事项是保密的，这里不会显示。输入新内容即可替换。）",
    confidentialLabel: "保密",
    confidentialHint:
      "请收到这项代祷的人为你保密；内容默认隐藏，点击后才会显示。",
    saving: "正在保存…",
    updateRequest: "更新代祷事项",
    submitRequest: "提交代祷事项",
    updated: "已更新。",
    submittedMsg: "已提交。",
    couldNotSubmit: "无法提交",
    closeTitle: "分配代祷",
    closeDescription:
      "关闭房间后，系统会把每个代祷事项分给另一位成员。",
    closing: "正在关闭…",
    closeAction: "关闭房间",
    needTwoMembers: "至少需要 2 位成员才能分配。",
    noRequestsYet: "还没有提交代祷事项。",
    closeConfirmTitle: "关闭房间并开始分配代祷？",
    closeConfirmDescription:
      "即将随机分配代祷事项，此操作无法撤销。",
    closeConfirmText: "关闭并分配",
    closeCancelText: "暂不",
    couldNotCloseRoom: "无法关闭祷告房间",
    cancelling: "正在取消…",
    cancelRoom: "取消祷告房间",
    cancelConfirmTitle: "取消这个祷告房间？",
    cancelConfirmDescription:
      "这个祷告房间会对所有人删除，其中所有代祷事项也会一并删除。此操作无法撤销。",
    cancelKeepText: "保留祷告房间",
    leaving: "正在离开…",
    leaveRoom: "离开祷告房间",
    leaveConfirmTitle: "离开这个祷告房间？",
    leaveConfirmDescription: "你在这里提交的代祷事项会被删除。",
    leaveStayText: "留下",
    somethingWentWrong: "出了点问题",
    revealConfidential: "显示保密内容",
    hideConfidential: "隐藏保密内容",
    hide: "隐藏",
    tapToReveal: "显示内容",
  },

  roomStatus: {
    open: "开放中",
    closed: "已关闭",
  },

  settings: {
    title: "设置",
    subtitle: "管理你的通行密钥、数据和账号。",
    displayNameTitle: "显示名称",
    displayNameDescription: "其他人在你的代祷事项旁和祷告房间里看到的名称。",
    couldNotSaveName: "无法保存你的名称",
    dataTitle: "你的数据",
    dataDescription:
      "下载我们保存的与你有关的所有内容，包括个人资料、同意记录、祷告房间和代祷事项，格式为 JSON。",
    downloadData: "下载我的数据",
    languageTitle: "语言",
    languageDescription:
      "选择同心圆的显示语言。此设置会保存到你的账号，并在各设备同步。",
    languageLabel: "显示语言",
    languageSaving: "正在保存…",
    couldNotSaveLanguage: "无法保存你的语言",
    sessionTitle: "登录状态",
    sessionDescription: "在这台设备上退出同心圆。",
    passkeysTitle: "通行密钥",
    passkeysDescription:
      "在另一台设备上添加备用通行密钥，避免丢失当前设备后无法登录。",
    syncedPasskey: "同步通行密钥",
    deviceBoundPasskey: "设备绑定通行密钥",
    passkeyAdded: "添加于 {date}",
    save: "保存",
    cancel: "取消",
    rename: "重命名",
    remove: "移除",
    passkeyNameLabel: "通行密钥名称",
    nameCannotBeEmpty: "名称不能为空。",
    onlyPasskeyNote: "你不能删除唯一的通行密钥。请先添加备用通行密钥。",
    working: "正在处理…",
    addBackupPasskey: "添加备用通行密钥",
    couldNotStartEnrollment: "无法开始添加通行密钥",
    enrollmentFailed: "添加通行密钥失败",
    couldNotAddPasskey: "无法添加通行密钥",
    couldNotRenamePasskey: "无法重命名通行密钥",
    couldNotRemovePasskey: "无法移除通行密钥",
    dangerTitle: "危险操作区",
    dangerDescription:
      "删除账号会移除你的代祷事项，以及你创建的任何祷告房间（包括其中所有成员的内容）。建议先[下载你的数据](/api/my/export)。",
    deleting: "正在删除…",
    deleteAccount: "删除账号",
    deleteConfirmTitle: "删除你的账号？",
    deleteConfirmDescription:
      "这会永久删除你的账号、代祷事项，以及你创建的所有祷告房间（包括其中所有成员的内容）。此操作无法撤销。",
    deleteConfirmText: "全部删除",
    couldNotDeleteAccount: "无法删除你的账号",
  },

  emails: {
    back: "← 同心圆",
    orPasteLink: "也可以把这个链接粘贴到浏览器中：",
    whyLine: "你收到这封邮件，是因为这个邮箱地址刚才被用于登录 {appName}。",
    ignoreLine: "如果这不是你本人请求的，可以放心忽略这封邮件，账号不会有任何变化。",
    recovery: {
      subject: "找回你的同心圆账号",
      previewLabel: "账号找回",
      bodyIntro: "你请求找回 {appName} 账号的访问权限。",
      ctaLabel: "设置新的通行密钥",
      expiryNote:
        "此链接将在 20 分钟后过期，且只能使用一次。设置新的通行密钥会移除账号中的旧通行密钥。",
    },
    loginLink: {
      subject: "你的同心圆登录链接",
      previewLabel: "邮箱登录链接",
      bodyIntro: "你请求使用邮箱链接登录 {appName}。",
      ctaLabel: "登录",
      expiryNote: "此链接将在 15 分钟后过期，且只能使用一次。",
    },
  },

  errors: {
    unauthorized: "未授权",
    forbidden: "没有权限",
    notFound: "未找到",
    verificationFailed: "验证失败",
    // 祷告房间
    roomNotFound: "未找到祷告房间",
    roomClosed: "祷告房间已关闭",
    alreadyClosed: "已经关闭",
    notAMember: "你不是成员",
    ownerOnly: "仅限房主",
    onlyOwnerCanRemove: "只有房主才能移除成员",
    ownerCannotBeRemoved: "无法移除房主",
    ownerMustCancel: "房主只能取消祷告房间，不能离开",
    needTwoMembers: "至少需要 2 位成员",
    noRequestsToAssign: "没有可分配的代祷事项",
    couldNotGenerateAssignment: "无法生成有效的分配方案",
    couldNotGenerateCode: "无法生成唯一房间号",
    codeRequired: "请填写房间号",
    nameRequired: "请填写名称",
    contentRequired: "请填写内容",
    // 认证
    noPendingEnrollment: "没有待处理的通行密钥添加请求",
    noPendingRegistration: "没有待处理的注册请求",
    noPendingRecovery: "没有待处理的账号找回请求",
    noPendingLogin: "没有待处理的登录请求",
    unknownCredential: "未知的凭据",
    couldNotStartRegistration: "无法开始注册",
    emailAndDisplayNameRequired: "请填写邮箱和显示名称",
    accountExists: "该邮箱已注册账号，请直接登录。",
    recoveryLinkInvalid: "这个账号找回链接无效或已过期。",
    signInLinkInvalid: "这个登录链接无效或已过期。",
    onlyPasskey:
      "你不能删除唯一的通行密钥。请先添加备用通行密钥，或使用账号找回。",
    passkeyNameLength: "名称长度必须为 1–{max} 个字符。",
    displayNameLength: "名称长度必须为 1–{max} 个字符。",
    // 其他
    mustAcceptTermsToRegister:
      "你必须接受条款并同意处理你的代祷事项才能注册。",
    mustAcceptTerms: "你必须接受条款并同意处理你的代祷事项。",
    unsupportedLanguage: "不支持的语言",
    answeredMustBeBoolean: "answered 必须是布尔值",
  },

  notFound: {
    title: "页面未找到",
    description: "你要找的页面不存在或已被移动。",
    backHome: "← 返回同心圆",
  },

  legal: {
    back: "← 同心圆",
    lastUpdated: "最后更新：{version}",
    privacy: {
      title: "隐私政策",
      sections: [
        {
          title: "1. 我们是谁",
          blocks: [
            {
              type: "p",
              md: "同心圆（{domain}）由 {legalName}（以 {tradingName} 名义运营，公司编号 {registrationNumber}）运营，注册地址为 {registeredAddress}。对于本政策所述的个人数据，我们是数据控制者。你可以通过 [{contactEmail}](mailto:{contactEmail}) 联系我们。",
            },
          ],
        },
        {
          title: "2. 我们收集哪些信息",
          blocks: [
            {
              type: "ul",
              items: [
                "**账号数据** — 你的邮箱地址和显示名称。",
                "**通行密钥元数据** — 用于登录的公钥和设备信息。你的生物识别信息（指纹、面容）始终留在你的设备上，绝不会发送给我们。",
                "**代祷事项** — 你写下的自由文本内容。由于代祷内容可能透露你的宗教信仰，根据英国 GDPR 第 9 条，这属于**特殊类别数据**；我们只会在你明确同意后处理。",
                "**祷告房间成员关系** — 你属于哪些祷告房间，以及哪些代祷事项被分配给你。",
                "**会话 Cookie** — 一个严格必要的 Cookie，用于保持登录状态（见第 5 节）。",
                "**访问日志** — 我们的托管服务商 AWS 会在服务器日志中记录 IP 地址和请求元数据，用于安全和故障排查。",
              ],
            },
          ],
        },
        {
          title: "3. 我们为何处理这些信息（法律依据）",
          blocks: [
            {
              type: "ul",
              items: [
                "**提供服务**（账号、祷告房间、分配）：履行合同 — 英国 GDPR 第 6(1)(b) 条。",
                "**代祷事项内容**：你的明确同意 — 第 9(2)(a) 条 — 你在注册时给予该同意，并可随时通过删除代祷事项或删除账号来撤回。",
                "**安全日志**：我们保持服务安全的正当利益 — 第 6(1)(f) 条。",
              ],
            },
          ],
        },
        {
          title: "4. 谁替我们处理数据",
          blocks: [
            {
              type: "p",
              md: "我们使用 Amazon Web Services 作为处理方：应用及其数据库运行在 eu-west-2（伦敦）区域的 AWS 服务器上，SES 用于发送事务邮件，CloudFront 负责在你与服务器之间传输流量——其边缘节点可能在英国境外处理传输中的数据，但你的数据仅存储在伦敦。我们不会向任何其他人出售或分享你的数据，本网站没有广告或分析追踪。",
            },
          ],
        },
        {
          title: "5. Cookie",
          blocks: [
            {
              type: "p",
              md: "我们只设置一个 Cookie：`amen-circle-session`。它是保持登录状态所严格必要的 Cookie，具有 httpOnly 属性，最长保留 30 天，且不包含任何追踪标识符。由于它是严格必要的，根据 PECR 不需要 Cookie 同意横幅。我们不使用任何分析 Cookie 或第三方 Cookie。",
            },
          ],
        },
        {
          title: "6. 我们如何保护数据",
          blocks: [
            {
              type: "p",
              md: "所有代祷事项内容都会在静态存储时加密（AES-256-GCM）。登录使用通行密钥，因此我们从不存储密码。登录和账号找回链接都是一次性、短时有效，并且只以哈希形式保存。",
            },
          ],
        },
        {
          title: "7. 我们保存多久",
          blocks: [
            {
              type: "ul",
              items: [
                "账号数据会保存至你删除账号；删除账号后会立即删除。",
                "当你删除代祷事项、离开祷告房间、祷告房间被删除，或你删除账号时，相关代祷事项会被删除。",
                "过期的登录和账号找回链接会自动清除。",
                "服务器访问日志保留 30 天。",
              ],
            },
          ],
        },
        {
          title: "8. 你的权利",
          blocks: [
            { type: "p", md: "根据英国 GDPR，你享有以下权利：" },
            {
              type: "ul",
              items: [
                "**访问和可携带性** — 在设置 → 下载我的数据中下载我们保存的与你有关的全部内容。",
                "**删除权** — 在设置 → 删除账号中删除你的账号（以及所有数据）。",
                "**更正权** — 联系我们更正你的信息。",
                "**撤回同意** — 你可以随时通过删除代祷事项或账号来撤回同意。撤回不影响撤回前已经进行的处理。",
                "**限制和反对处理** — 通过 [{contactEmail}](mailto:{contactEmail}) 联系我们。",
                "**投诉** — 向英国信息专员办公室投诉：[ico.org.uk](https://ico.org.uk)。",
              ],
            },
          ],
        },
        {
          title: "9. 谁可以使用同心圆",
          blocks: [
            {
              type: "p",
              md: "同心圆仅供成年人使用。你必须年满 18 岁才能创建账号。",
            },
          ],
        },
        {
          title: "10. 本政策的变更",
          blocks: [
            {
              type: "p",
              md: "如果我们作出重大变更，我们会更新本页面和上方的“最后更新”日期，并在适当情况下再次请求你的同意。",
            },
          ],
        },
      ],
    },
    terms: {
      title: "服务条款",
      sections: [
        {
          title: "1. 同心圆是什么",
          blocks: [
            {
              type: "p",
              md: "同心圆（{domain}）让可信任的朋友组成小型祷告房间，分享代祷事项，并彼此代祷。服务由 {legalName}（以 {tradingName} 名义运营，公司编号 {registrationNumber}）运营，注册地址为 {registeredAddress}。创建账号即表示你同意这些条款。",
            },
          ],
        },
        {
          title: "2. 使用资格",
          blocks: [
            { type: "p", md: "你必须年满 18 岁才能使用同心圆。" },
          ],
        },
        {
          title: "3. 你的账号",
          blocks: [
            {
              type: "p",
              md: "你通过通行密钥或一次性邮箱链接登录。你有责任保护设备和邮箱账号安全，并对通过你账号进行的所有操作负责。如果你认为账号已被盗用，请及时通过 [{contactEmail}](mailto:{contactEmail}) 告诉我们。",
            },
          ],
        },
        {
          title: "4. 你的内容",
          blocks: [
            {
              type: "p",
              md: "你的代祷事项仍归你所有。你授予我们有限许可，用于存储、加密并向你分享所在祷告房间的成员展示这些内容；这正是本服务的全部目的，我们不会将你的内容用于其他用途。",
            },
            {
              type: "p",
              md: "**请记住，其他成员会阅读你分享的内容。** 祷告房间是私密的，但房间里的人会看到分配给他们的代祷事项。不要分享任何你不希望祷告房间其他成员知道的内容，包括他人的私人信息。",
            },
          ],
        },
        {
          title: "5. 可接受使用",
          blocks: [
            {
              type: "p",
              md: "你不得使用同心圆发布或分享以下内容：",
            },
            {
              type: "ul",
              items: [
                "违法内容，或侵犯他人权利的内容；",
                "辱骂、骚扰、威胁或仇恨内容；",
                "故意误导的内容，或任何形式的垃圾信息、广告。",
              ],
            },
            {
              type: "p",
              md: "你不得尝试破坏、探测或过载本服务，也不得访问其他用户的数据。",
            },
          ],
        },
        {
          title: "6. 举报内容和管理",
          blocks: [
            {
              type: "p",
              md: "如果你看到违反这些条款的内容，请通过 [{contactEmail}](mailto:{contactEmail}) 举报（请包含祷告房间信息，并尽可能包含相关代祷事项）。我们可能会移除内容、将成员移出祷告房间，或暂停、终止违反条款的账号。房主也可以从自己的祷告房间中移除成员。",
            },
          ],
        },
        {
          title: "7. 祷告房间和账号删除",
          blocks: [
            {
              type: "p",
              md: "如果你删除账号，你的代祷事项会被删除，并且**你创建的任何祷告房间都会对所有成员删除**，其中的代祷事项也会一并删除。离开祷告房间会删除你在其中分享的代祷事项。",
            },
          ],
        },
        {
          title: "8. 非专业建议",
          blocks: [
            {
              type: "p",
              md: "同心圆是朋友之间彼此代祷的工具。本服务中的任何内容都不构成专业、医疗、心理健康、法律或牧养建议。如果你或你认识的人正处于危机中，请联系当地紧急服务或合资格的专业人士。",
            },
          ],
        },
        {
          title: "9. 服务按现状提供",
          blocks: [
            {
              type: "p",
              md: "同心圆免费提供，并按“现状”和“可用”状态提供，不作任何形式的保证。在法律允许的最大范围内，我们不对你使用本服务所产生的任何间接或后果性损失负责。本条款中的任何内容都不限制法律不允许限制的责任，包括因过失造成的死亡或人身伤害责任，或欺诈责任。",
            },
          ],
        },
        {
          title: "10. 终止或变更服务",
          blocks: [
            {
              type: "p",
              md: "你可以随时停止使用同心圆并删除账号。我们可能会暂停或终止违反这些条款的账号，也可能变更或停止本服务；如果我们停止本服务，会在可行情况下提前给予合理通知。我们可能会更新这些条款；重大变更会反映在上方的“最后更新”日期中。",
            },
          ],
        },
        {
          title: "11. 适用法律",
          blocks: [
            {
              type: "p",
              md: "本条款受英格兰和威尔士法律管辖，英格兰和威尔士法院拥有专属管辖权。",
            },
          ],
        },
      ],
    },
  },
};
