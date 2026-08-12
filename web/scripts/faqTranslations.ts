/* English and Chinese for the built-in FAQ, keyed by the seeded slug.
 *
 * Kept as data next to the seeder rather than typed into the CMS by hand, so
 * the same set can be applied to a fresh database or re-applied after a reset.
 * The team can still edit any of it in /admin/cms afterwards — the applier
 * never overwrites a locale that already has text.
 *
 * Terminology follows the Thai source: ร.ง.4 is the factory operating licence
 * issued by the Department of Industrial Works, and the zoning colours are the
 * ones on Thailand's city-planning maps.
 */
export type FaqTr = { category: string; title: string; body: string };

export const FAQ_CATEGORIES: Record<string, { en: string; zh: string }> = {
  'เริ่มต้นใช้งาน': { en: 'Getting started', zh: '开始使用' },
  'ทำเลที่ตั้งและการวางผังเมือง': { en: 'Location and zoning', zh: '选址与城市规划' },
  'ใบอนุญาตและเอกสาร': { en: 'Permits and paperwork', zh: '许可证与文件' },
  'การค้นหาและการเยี่ยมชมทรัพย์': { en: 'Searching and site visits', zh: '房源搜索与实地看房' },
  'ความพร้อม ไฟฟ้า และแรงงาน': { en: 'Utilities, power and labour', zh: '配套、电力与劳动力' },
  'เงื่อนไขการเช่าและสัญญา': { en: 'Lease terms and contracts', zh: '租赁条款与合同' },
  'ค่าใช้จ่าย ภาษี และการเงิน': { en: 'Costs, tax and financing', zh: '费用、税务与融资' },
  'ซ่อมบำรุงและการปรับปรุง': { en: 'Maintenance and fit-out', zh: '维护与改造' },
  'การประกันภัยและการบริหารความเสี่ยง': { en: 'Insurance and risk', zh: '保险与风险管理' },
};

export const FAQ_TRANSLATIONS: Record<string, { en: Omit<FaqTr, 'category'>; zh: Omit<FaqTr, 'category'> }> = {
  'basics-1': {
    en: { title: 'How do I get started?', body: 'Registration is free. Use the “Contact our team” button or fill in the property search form, and our team will get back to you within 24 hours.' },
    zh: { title: '如何开始使用网站？', body: '注册完全免费。点击「联系我们」按钮或填写房源搜索表单，我们的团队将在 24 小时内与您联系。' },
  },
  'basics-2': {
    en: { title: 'Is there a fee for searching for a property?', body: 'No. Searching and consulting with our team is free of charge.' },
    zh: { title: '搜索房源需要付费吗？', body: '不需要。搜索房源和咨询我们的团队均不收取任何费用。' },
  },
  'basics-3': {
    en: { title: 'Do you translate documents into English or Chinese?', body: 'Yes. Our team communicates and translates documents in Thai, English and Chinese.' },
    zh: { title: '是否提供英文或中文的文件翻译服务？', body: '提供。我们的团队可用泰文、英文和中文沟通并翻译文件。' },
  },
  'reg-1': {
    en: { title: 'Which locations suit a factory that ships time-critical goods?', body: 'Sites near Suvarnabhumi or Don Mueang airport suit goods that move by air or on tight deadlines.' },
    zh: { title: '哪些位置适合需要快速运输的工厂？', body: '靠近素万那普机场或廊曼机场的位置，适合需要空运或时效性强的货物。' },
  },
  'reg-2': {
    en: { title: 'How does the zoning colour affect what I can operate?', body: 'The city-planning colour (purple, green and so on) determines which types of business are permitted. Always check it before deciding to lease or buy.' },
    zh: { title: '城市规划分区颜色对经营有何影响？', body: '城市规划的颜色（紫色、绿色等）决定了该地块允许经营的业务类型。在决定租赁或购买前务必先行核实。' },
  },
  'reg-3': {
    en: { title: 'How does an industrial estate differ from an ordinary site?', body: 'An industrial estate comes with tax privileges and ready-made utilities, which suits medium and large operations.' },
    zh: { title: '工业园区与普通地块有何不同？', body: '工业园区提供税务优惠和现成的公用配套设施，适合中大型企业。' },
  },
  'docs-1': {
    en: { title: 'Which licence do I need before starting operations?', body: 'You need a factory operating licence (Ror.Ngor.4) from the Department of Industrial Works before you begin operating.' },
    zh: { title: '开业前需要办理哪些许可证？', body: '开始经营前，需向泰国工业厂务厅申请工厂经营许可证（Ror.Ngor.4，即「4号许可证」）。' },
  },
  'docs-2': {
    en: { title: 'Can your team help with the legal paperwork?', body: 'Our team gives initial guidance and, where appropriate, puts you in touch with legal specialists.' },
    zh: { title: '贵司团队能协助处理法律文件吗？', body: '我们的团队提供初步咨询，并会根据情况为您对接法律专业人士。' },
  },
  'docs-3': {
    en: { title: 'Do I need an EIA?', body: 'Some categories of business with a significant environmental impact must complete an Environmental Impact Assessment before applying for a construction permit.' },
    zh: { title: '是否需要做环境影响评估（EIA）？', body: '部分对环境影响较大的业务类型，必须在申请施工许可前完成环境影响评估报告。' },
  },
  'listing-1': {
    en: { title: 'How do I arrange a site visit?', body: 'Open the property you are interested in, click “View details”, then contact our team to arrange a visit at a time that suits you.' },
    zh: { title: '如何预约实地看房？', body: '在感兴趣的房源上点击「查看详情」，然后联系我们的团队，安排您方便的时间前往实地查看。' },
  },
  'listing-2': {
    en: { title: 'Has every listing been checked?', body: 'Every listing has its documents and physical condition verified before it is published on the site.' },
    zh: { title: '所有房源都经过核查吗？', body: '每一处房源在上架前，都已完成产权文件核验与实地状况检查。' },
  },
  'listing-3': {
    en: { title: 'Does the listed price include other costs?', body: 'The price shown is the owner’s asking price. It does not include transfer fees or other costs that may arise.' },
    zh: { title: '标示价格是否包含其他费用？', body: '所示价格为业主的起始报价，不含过户费或其他可能产生的费用。' },
  },
  'utilities-1': {
    en: { title: 'Do most properties have three-phase power?', body: 'Most factories and warehouses on our books have three-phase power ready. Check each listing for the details.' },
    zh: { title: '大多数房源是否配备三相电？', body: '本平台大多数厂房和仓库均已配备三相电，具体请查看各房源的详情页。' },
  },
  'utilities-2': {
    en: { title: 'What floor loading can the buildings take?', body: 'It varies by property, from 1 to 5 tonnes per square metre. The figure is stated on each listing.' },
    zh: { title: '地面最大承重是多少？', body: '视各房源而定，从每平方米 1 至 5 吨不等，详情页中均有标注。' },
  },
  'utilities-3': {
    en: { title: 'Is there a local labour pool?', body: 'Most locations are close to communities and industrial estates with an available workforce.' },
    zh: { title: '周边是否有充足的劳动力？', body: '大多数位置临近社区和工业园区，劳动力供给充足。' },
  },
  'contract-1': {
    en: { title: 'What is the minimum lease term?', body: 'Three years is typical, though it depends on each owner’s terms.' },
    zh: { title: '最短租期是多久？', body: '通常最短租期为 3 年，具体视各业主的条件而定。' },
  },
  'contract-2': {
    en: { title: 'How much is the security deposit?', body: 'Usually two to three months’ rent, and it can be negotiated.' },
    zh: { title: '租赁押金是多少？', body: '通常为 2 至 3 个月租金，可视情况协商。' },
  },
  'contract-3': {
    en: { title: 'Can I lease for less than a year?', body: 'Some properties accept short-term leases. Contact our team to check the terms for a specific one.' },
    zh: { title: '可以租期短于 1 年吗？', body: '部分房源接受短期租约，请联系我们的团队确认具体房源的条件。' },
  },
  'payment-1': {
    en: { title: 'What is the transfer fee on a purchase?', body: 'Around 2% of the appraised value, as set by the Department of Lands.' },
    zh: { title: '买卖过户费是多少？', body: '约为评估价的 2%，依土地厅的规定计收。' },
  },
  'payment-2': {
    en: { title: 'Can I get bank financing to buy a factory?', body: 'Yes. Our team can introduce partner banks that lend against industrial property.' },
    zh: { title: '购买厂房可以申请银行贷款吗？', body: '可以。我们的团队可为您推荐提供工业地产贷款的合作银行。' },
  },
  'maintain-1': {
    en: { title: 'Who pays for structural maintenance?', body: 'The owner is generally responsible for the main structure and the tenant for day-to-day use. The split is set out in the lease.' },
    zh: { title: '主体结构的维修费用由谁承担？', body: '通常主体结构由业主负责，日常使用维护由承租方负责，具体以租赁合同约定为准。' },
  },
  'maintain-2': {
    en: { title: 'Can I fit out the interior?', body: 'Yes, on terms agreed with the owner before any work begins.' },
    zh: { title: '可以对室内进行改造吗？', body: '可以，需在动工前与业主就相关条件达成一致。' },
  },
  'insurance-1': {
    en: { title: 'Should I insure the factory?', body: 'We recommend fire and all-risks cover to protect the property and the machinery in it.' },
    zh: { title: '工厂需要购买保险吗？', body: '建议投保火灾险和一切险，以保障厂房资产与机器设备。' },
  },
  'insurance-2': {
    en: { title: 'Does the tenant need their own insurance?', body: 'It depends on the lease. In most cases the tenant must carry third-party liability cover.' },
    zh: { title: '承租方需要自行投保吗？', body: '视合同条款而定，多数情况下承租方须投保第三者责任险。' },
  },
};
