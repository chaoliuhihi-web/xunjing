package cn.iocoder.yudao.module.xunjing.service.app.trigger;

import cn.iocoder.yudao.framework.common.util.json.JsonUtils;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.LocationPointReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalCandidateRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.MultimodalTriggerRespVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.PhotoMetaReqVO;
import cn.iocoder.yudao.module.xunjing.controller.app.vo.XunjingAppVO.SourceRespVO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.packagepkg.XunjingResourcePackageDO;
import cn.iocoder.yudao.module.xunjing.dal.dataobject.poi.XunjingPoiDO;
import cn.iocoder.yudao.module.xunjing.dal.mysql.packagepkg.XunjingResourcePackageMapper;
import cn.iocoder.yudao.module.xunjing.dal.mysql.poi.XunjingPoiMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Component
@Slf4j
public class XunjingMultimodalTriggerEngine {

    private static final String REGION_XICHENG = "beijing-xicheng";
    private static final String POI_STATUS_PUBLISHED = "PUBLISHED";
    private static final String PACKAGE_STATUS_PUBLISHED = "PUBLISHED";
    private static final String REVIEW_STATUS_APPROVED = "APPROVED";
    private static final double AUTO_TRIGGER_THRESHOLD = 0.85D;
    private static final List<String> SCENE_SIGNAL_CONTEXT_KEYS = List.of(
            "sceneFusionSummary",
            "worldInterfaceSummary",
            "sceneDomainIntentKey",
            "sceneDomainIntentLabel",
            "sceneDomainIntentTitle",
            "sceneDomainIntentCopy",
            "agentDecisionActionTitle",
            "agentDecisionReasonSummary",
            "knowledgeGraphKeywords",
            "relatedTopicKeywords",
            "nearbyActivitySummary",
            "merchantServiceSummary",
            "routeRecommendationSummary",
            "menuItemNames",
            "spiceLevelSummary",
            "halalSuitabilityText",
            "dishRecommendationSummary",
            "foodItemName",
            "foodOriginSummary",
            "cookingMethodSummary",
            "eatingMethodSummary",
            "pairingSuggestionText",
            "nearbyFoodRecommendationSummary",
            "signOriginalText",
            "signTranslationText",
            "signPronunciationText",
            "signNavigationHint",
            "recognizedObjectName",
            "eraOrPeriodText",
            "structureOrCraftSummary",
            "historicalStorySummary",
            "hiddenDetailSummary",
            "heritageItemName",
            "heritageCategoryText",
            "craftProcessSummary",
            "performanceMethodSummary",
            "soundAssetHint",
            "nearbyExperienceSummary"
    );

    private static final List<PoiProfile> XICHENG_POIS = List.of(
            new PoiProfile("xicheng-baitasi", "妙应寺白塔",
                    List.of("妙应寺白塔", "妙应寺", "白塔寺", "白塔寺东夹道", "白塔"),
                    List.of("white_pagoda", "pagoda", "temple", "temple_gate", "baitasi", "miaoying_temple"),
                    39.923100D, 116.357260D, 220D, "白塔寺片区的北京城市更新和元代白塔文化节点。",
                    List.of("给我讲讲妙应寺白塔的来历。", "白塔寺片区适合怎么 Citywalk？", "这里有哪些适合拍照的角度？"),
                    List.of(new SourceProfile("妙应寺白塔", "西城区文旅公开资料",
                            "https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/",
                            "妙应寺白塔是西城白塔寺片区的重要历史文化地标。"))),
            new PoiProfile("xicheng-emperors-temple", "历代帝王庙",
                    List.of("历代帝王庙", "帝王庙", "帝王庙大街"),
                    List.of("imperial_temple", "temple", "paifang", "beijing_architecture"),
                    39.918930D, 116.365870D, 180D, "明清皇家礼制和北京中轴文化延展的重要观察点。",
                    List.of("历代帝王庙为什么重要？", "从这里下一站推荐去哪？", "适合亲子研学怎么讲？"),
                    List.of(new SourceProfile("历代帝王庙", "西城区文旅公开资料",
                            "https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/",
                            "历代帝王庙是理解北京礼制文化和历史街区的重要点位。"))),
            new PoiProfile("xicheng-beihai-park", "北海公园",
                    List.of("北海公园", "北海", "琼华岛", "北海白塔"),
                    List.of("lake", "imperial_garden", "white_tower", "park", "beihai"),
                    39.925450D, 116.389020D, 520D, "皇家园林、白塔和水岸空间共同构成的北京文化地标。",
                    List.of("北海公园有哪些必看点？", "北海白塔和妙应寺白塔有什么区别？", "适合半日游怎么走？"),
                    List.of(new SourceProfile("北海公园", "西城区文旅公开资料",
                            "https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/",
                            "北海公园是西城核心皇家园林文旅点位。"))),
            new PoiProfile("xicheng-shichahai", "什刹海",
                    List.of("什刹海", "后海", "前海", "西海"),
                    List.of("lake", "hutong", "waterfront", "old_beijing", "shichahai"),
                    39.940310D, 116.386390D, 650D, "胡同、水系和市井生活交织的老北京漫游片区。",
                    List.of("什刹海适合怎么逛？", "这里有哪些老北京故事？", "附近下一站推荐哪里？"),
                    List.of(new SourceProfile("什刹海", "西城区文旅公开资料",
                            "https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/",
                            "什刹海是胡同、水系和城市漫步结合的代表片区。"))),
            new PoiProfile("xicheng-yandai-xiejie", "烟袋斜街",
                    List.of("烟袋斜街", "烟袋", "什刹海烟袋斜街"),
                    List.of("hutong", "shop_sign", "historic_street"),
                    39.940700D, 116.391550D, 220D, "什刹海胡同漫游线上的高频街巷点。",
                    List.of("烟袋斜街为什么出名？", "这里适合拍什么？", "怎么接银锭桥和后海？"),
                    List.of(new SourceProfile("烟袋斜街", "北京旅游网公开资料",
                            "https://www.visitbeijing.com.cn/article/47Qs8CSbNMv",
                            "烟袋斜街是什刹海胡同漫游线上的高频街巷点。"))),
            new PoiProfile("xicheng-dashilar", "大栅栏",
                    List.of("大栅栏", "前门大栅栏", "杨梅竹斜街", "北京坊"),
                    List.of("hutong", "shop_sign", "old_beijing", "qianmen", "dashilar"),
                    39.894380D, 116.393660D, 360D, "老字号、商业街巷和近代城市生活的西城代表片区。",
                    List.of("大栅栏有哪些老字号？", "这条街适合怎么拍照？", "附近适合亲子观察什么？"),
                    List.of(new SourceProfile("大栅栏", "西城区文旅公开资料",
                            "https://www.bjxch.gov.cn/xxgk/zdly/jgxx/lyscjg/",
                            "大栅栏是老字号、商业街巷和北京近代城市生活的代表片区。")))
    );

    @Resource
    private XunjingVisionRecognitionService visionRecognitionService;
    @Resource
    private XunjingPoiMapper poiMapper;
    @Resource
    private XunjingResourcePackageMapper resourcePackageMapper;

    public MultimodalTriggerRespVO resolve(MultimodalTriggerReqVO reqVO) {
        MultimodalTriggerReqVO safeReqVO = visionRecognitionService.enrich(
                reqVO == null ? new MultimodalTriggerReqVO() : reqVO);
        String regionCode = normalizeRegionCode(safeReqVO.getRegionCode());
        List<PoiProfile> poiProfiles = loadPoiProfiles(regionCode, safeReqVO.getPackageCode());
        String sceneSignalContextText = buildSceneSignalContextText(safeReqVO);

        List<MatchScore> matches = poiProfiles.stream()
                .map(poi -> score(poi, safeReqVO, sceneSignalContextText))
                .filter(match -> match.confidence() > 0D)
                .sorted(Comparator.comparing(MatchScore::confidence).reversed()
                        .thenComparing(MatchScore::distanceMeters, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(match -> match.poi().radiusMeters()))
                .limit(3)
                .toList();

        if (matches.isEmpty()) {
            return noMatch(regionCode, safeReqVO.getPackageCode());
        }
        String intent = detectIntent(safeReqVO, sceneSignalContextText);
        MatchScore best = matches.get(0);
        boolean autoTrigger = best.confidence() >= AUTO_TRIGGER_THRESHOLD;

        MultimodalTriggerRespVO respVO = new MultimodalTriggerRespVO();
        respVO.setIntent(intent);
        respVO.setAction(resolveAction(intent, autoTrigger));
        respVO.setTriggerType(resolveTriggerType(best.signals()));
        respVO.setPackageCode(safeReqVO.getPackageCode());
        respVO.setRegionCode(regionCode);
        respVO.setPoiCode(best.poi().code());
        respVO.setPoiName(best.poi().name());
        respVO.setConfidence(best.confidence());
        respVO.setRequiresUserConfirm(!autoTrigger);
        respVO.setReason(buildReason(best.signals(), autoTrigger, intent, safeReqVO.getSceneSignals()));
        respVO.setTargetPath(buildTargetPath(intent, regionCode, best.poi().code(), safeReqVO.getPackageCode(), !autoTrigger));
        respVO.setSuggestedQuestions(best.poi().suggestedQuestions());
        respVO.setSources(toSources(best.poi()));
        respVO.setCandidates(matches.stream()
                .map(match -> toCandidate(match, intent, regionCode, safeReqVO.getPackageCode()))
                .toList());
        return respVO;
    }

    private MatchScore score(PoiProfile poi, MultimodalTriggerReqVO reqVO, String sceneSignalContextText) {
        double score = 0D;
        Set<String> signals = new LinkedHashSet<>();
        Double distanceMeters = null;

        LocationPointReqVO location = effectiveLocation(reqVO);
        if (hasCoordinate(location) && poi.hasCoordinate()) {
            distanceMeters = haversineMeters(
                    location.getLatitude().doubleValue(), location.getLongitude().doubleValue(),
                    poi.latitude(), poi.longitude());
            if (distanceMeters <= poi.radiusMeters()) {
                score += 0.38D;
                signals.add("gps_radius");
            } else if (distanceMeters <= poi.radiusMeters() * 2D) {
                score += 0.18D;
                signals.add("gps_nearby");
            }
        }

        if (containsAlias(reqVO.getOcrText(), poi)) {
            score += 0.45D;
            signals.add("ocr_alias");
        }
        if (containsAlias(reqVO.getText(), poi)) {
            score += 0.34D;
            signals.add("text_alias");
        }
        if (containsAlias(sceneSignalContextText, poi)) {
            score += 0.24D;
            signals.add("scene_context_alias");
        }
        if (reqVO.getRecentPoiCodes() != null && reqVO.getRecentPoiCodes().contains(poi.code())) {
            score += 0.08D;
            signals.add("context_poi");
        }

        int imageMatchCount = imageMatchCount(reqVO.getImageLabels(), poi);
        if (imageMatchCount > 0) {
            score += Math.min(0.38D, 0.22D + (imageMatchCount - 1) * 0.08D);
            signals.add("image_label");
        }

        return new MatchScore(poi, round2(Math.min(score, 0.99D)), distanceMeters, List.copyOf(signals));
    }

    private List<PoiProfile> loadPoiProfiles(String regionCode, String packageCode) {
        if (!REGION_XICHENG.equals(regionCode)) {
            return List.of();
        }
        List<PoiProfile> databasePoiProfiles = loadDatabasePoiProfiles(regionCode, packageCode);
        if (hasText(packageCode)) {
            return databasePoiProfiles;
        }
        return databasePoiProfiles.isEmpty() ? XICHENG_POIS : databasePoiProfiles;
    }

    private List<PoiProfile> loadDatabasePoiProfiles(String regionCode, String packageCode) {
        try {
            if (hasText(packageCode)) {
                XunjingResourcePackageDO resourcePackage = resourcePackageMapper.selectByPackageCodeAndStatus(
                        packageCode, PACKAGE_STATUS_PUBLISHED);
                if (resourcePackage == null || resourcePackage.getId() == null) {
                    return List.of();
                }
                return poiMapper.selectPublishedListByRegionCodeAndPackageId(
                                regionCode, resourcePackage.getId(), POI_STATUS_PUBLISHED, REVIEW_STATUS_APPROVED).stream()
                        .map(this::toPoiProfile)
                        .toList();
            }
            return poiMapper.selectPublishedListByRegionCode(
                            regionCode, POI_STATUS_PUBLISHED, REVIEW_STATUS_APPROVED).stream()
                    .map(this::toPoiProfile)
                    .toList();
        } catch (RuntimeException ex) {
            log.warn("[loadDatabasePoiProfiles][regionCode({}) fallback to static POIs]", regionCode, ex);
            return List.of();
        }
    }

    private PoiProfile toPoiProfile(XunjingPoiDO poi) {
        Map<String, Object> trigger = parseJsonObject(poi.getTriggerJson());
        Map<String, Object> content = parseJsonObject(poi.getContentJson());
        Map<String, Object> source = parseJsonObject(poi.getSourceJson());

        List<String> aliases = new ArrayList<>();
        addText(aliases, poi.getName());
        addText(aliases, poi.getOfficialName());
        aliases.addAll(parseStringArray(poi.getAliasesJson()));
        aliases.addAll(stringListFromValue(trigger.get("ocrKeywords")));

        List<String> visualLabels = stringListFromValue(trigger.get("photoLabels"));
        String summary = stringValue(content.get("shortIntro"),
                stringValue(source.get("contentDigest"), defaultIfBlank(poi.getOfficialName(), poi.getName())));
        List<String> suggestedQuestions = stringListFromValue(content.get("recommendedQuestions"));
        if (suggestedQuestions.isEmpty()) {
            suggestedQuestions = defaultSuggestedQuestions(poi.getName());
        }

        return new PoiProfile(
                poi.getPoiCode(),
                poi.getName(),
                distinctTexts(aliases),
                distinctTexts(visualLabels),
                doubleValue(poi.getLatitude()),
                doubleValue(poi.getLongitude()),
                doubleValue(trigger.get("gpsRadiusMeters"), 220D),
                summary,
                suggestedQuestions,
                sourceProfiles(poi, source, summary));
    }

    private MultimodalCandidateRespVO toCandidate(MatchScore match, String intent, String regionCode, String packageCode) {
        MultimodalCandidateRespVO candidate = new MultimodalCandidateRespVO();
        candidate.setPoiCode(match.poi().code());
        candidate.setPoiName(match.poi().name());
        candidate.setConfidence(match.confidence());
        candidate.setDistanceMeters(match.distanceMeters() == null ? null : round1(match.distanceMeters()));
        candidate.setSummary(match.poi().summary());
        candidate.setTargetPath(buildTargetPath(intent, regionCode, match.poi().code(), packageCode, true));
        candidate.setSuggestedQuestions(match.poi().suggestedQuestions());
        candidate.setSources(toSources(match.poi()));
        candidate.setMatchedSignals(match.signals());
        return candidate;
    }

    private MultimodalTriggerRespVO noMatch(String regionCode, String packageCode) {
        MultimodalTriggerRespVO respVO = new MultimodalTriggerRespVO();
        respVO.setIntent("ask");
        respVO.setAction("ask_ai_companion");
        respVO.setTriggerType("none");
        respVO.setPackageCode(packageCode);
        respVO.setRegionCode(regionCode);
        respVO.setConfidence(0D);
        respVO.setRequiresUserConfirm(true);
        respVO.setReason("定位、文字和图片信号不足，进入问问小京。");
        respVO.setTargetPath("/pages/ai-chat/index" + buildContextQuery(regionCode, null, packageCode, false));
        respVO.setSuggestedQuestions(List.of("我在西城附近，有什么值得看的地方？", "我可以拍什么让小京识别？"));
        respVO.setSources(List.of());
        respVO.setCandidates(List.of());
        return respVO;
    }

    private List<SourceProfile> sourceProfiles(XunjingPoiDO poi, Map<String, Object> source, String summary) {
        String sourceUrl = stringValue(source.get("sourceUrl"), "");
        String contentDigest = stringValue(source.get("contentDigest"), summary);
        if (!hasText(sourceUrl) && !hasText(contentDigest)) {
            return List.of();
        }
        return List.of(new SourceProfile(
                poi.getName(),
                stringValue(source.get("sourceType"), "OFFICIAL_PUBLIC"),
                sourceUrl,
                contentDigest));
    }

    private List<SourceRespVO> toSources(PoiProfile poi) {
        return poi.sources().stream()
                .map(source -> {
                    SourceRespVO respVO = new SourceRespVO();
                    respVO.setTitle(source.title());
                    respVO.setSourceType(source.sourceType());
                    respVO.setSourceUrl(source.sourceUrl());
                    respVO.setContentDigest(source.contentDigest());
                    respVO.setScore(0.90D);
                    return respVO;
                })
                .toList();
    }

    private String detectIntent(MultimodalTriggerReqVO reqVO, String sceneSignalContextText) {
        String sceneIntent = detectSceneSignalIntent(reqVO.getSceneSignals());
        if (hasText(sceneIntent)) {
            return sceneIntent;
        }
        String explicitText = normalize(defaultIfBlank(reqVO.getText(), "") + " " + defaultIfBlank(reqVO.getOcrText(), ""));
        String fusedText = normalize(explicitText + " " + sceneSignalContextText);
        if (containsAny(fusedText, List.of("下一站", "路线", "怎么走", "去哪", "行程", "推荐路线"))) {
            return "route";
        }
        if (containsAny(fusedText, List.of("菜单", "菜品", "推荐菜", "好吃", "美食", "餐厅", "小吃", "咖啡", "清真"))) {
            return "food";
        }
        if (containsAny(fusedText, List.of("animal", "wildlife", "snowleopard", "snow_leopard",
                "动物", "野生动物", "雪豹", "会不会危险", "是否危险", "保持距离", "不要靠近", "不要投喂"))) {
            return "safety";
        }
        if (containsAny(fusedText, List.of("artifact", "relic", "intangibleheritage", "intangible_heritage",
                "plant", "person", "文物", "青铜", "器物", "古剑", "非遗", "乐器", "热瓦普", "工艺",
                "植物", "胡杨", "树龄", "人物", "雕像", "塑像", "画像", "年代", "用途", "同时代"))) {
            return "interpret";
        }
        if (containsAny(explicitText, List.of("拍照建议", "拍照角度", "最佳拍摄", "拍摄时间", "机位", "构图",
                "夕阳", "日落", "先拍照"))) {
            return "photo";
        }
        if (containsAny(explicitText, List.of("游记", "旅行记录", "生成游记", "打卡", "徽章"))) {
            return "record";
        }
        return "guide";
    }

    private String resolveAction(String intent, boolean autoTrigger) {
        return switch (intent) {
            case "route" -> autoTrigger ? "open_route_recommendation" : "confirm_route_recommendation";
            case "food" -> autoTrigger ? "open_food_recommendation" : "confirm_food_recommendation";
            case "record" -> autoTrigger ? "start_travel_note" : "confirm_travel_note";
            case "activity" -> autoTrigger ? "open_activity_handoff" : "confirm_activity_handoff";
            case "translate" -> autoTrigger ? "start_sign_translation" : "confirm_sign_translation";
            case "safety" -> autoTrigger ? "start_safety_advisory" : "confirm_safety_advisory";
            case "interpret" -> autoTrigger ? "start_scene_interpretation" : "confirm_scene_interpretation";
            case "photo" -> autoTrigger ? "start_photo_advice" : "confirm_photo_advice";
            default -> autoTrigger ? "start_ai_guide" : "confirm_ai_guide";
        };
    }

    private String buildTargetPath(String intent, String regionCode, String poiCode, String packageCode, boolean confirm) {
        String query = buildContextQuery(regionCode, poiCode, packageCode, confirm);
        return switch (intent) {
            case "route" -> "/pages/routes/recommend" + query;
            case "food" -> "/pages/food/recommend" + query;
            case "record" -> "/pages/travel-note/edit" + query;
            case "activity" -> "/pages/activity/recommend" + query;
            case "translate" -> "/pages/ai-guide/detail" + query;
            case "safety" -> "/pages/ai-guide/detail" + query;
            case "interpret" -> "/pages/ai-guide/detail" + query;
            case "photo" -> "/pages/ai-guide/detail" + query;
            default -> "/pages/ai-guide/detail" + query;
        };
    }

    private String buildContextQuery(String regionCode, String poiCode, String packageCode, boolean confirm) {
        List<String> params = new ArrayList<>();
        params.add("regionCode=" + regionCode);
        if (hasText(poiCode)) {
            params.add("poiCode=" + poiCode);
        }
        if (hasText(packageCode)) {
            params.add("packageCode=" + packageCode);
        }
        if (confirm) {
            params.add("confirm=1");
        }
        return "?" + String.join("&", params);
    }

    private String resolveTriggerType(List<String> signals) {
        if (signals.contains("ocr_alias")) {
            return "ocr";
        }
        if (signals.contains("gps_radius") || signals.contains("gps_nearby")) {
            return "location";
        }
        if (signals.contains("image_label")) {
            return "image";
        }
        if (signals.contains("text_alias")) {
            return "text";
        }
        return "context";
    }

    private String buildReason(
            List<String> signals, boolean autoTrigger, String intent, Map<String, Object> sceneSignals) {
        List<String> parts = new ArrayList<>();
        if (signals.contains("gps_radius") || signals.contains("gps_nearby")) {
            parts.add("定位");
        }
        if (signals.contains("ocr_alias")) {
            parts.add("OCR文字");
        }
        if (signals.contains("text_alias")) {
            parts.add("用户文本");
        }
        if (signals.contains("image_label")) {
            parts.add("图片识别");
        }
        if (signals.contains("scene_context_alias")) {
            parts.add("场景理解");
        }
        if (signals.contains("context_poi")) {
            parts.add("上下文");
        }
        if ("route".equals(intent) && hasText(detectRealtimeRouteIntent(sceneSignals))) {
            parts.add("实时环境");
        }
        if (intent.equals(detectAgentDecisionIntent(sceneSignals))) {
            parts.add("Agent决策");
        }
        String evidence = parts.isEmpty() ? "上下文" : String.join("+", parts);
        return autoTrigger ? evidence + "已达到自动触发阈值。" : evidence + "匹配到候选点，需用户确认。";
    }

    private boolean containsAlias(String text, PoiProfile poi) {
        if (!hasText(text)) {
            return false;
        }
        String normalizedText = normalize(text);
        return poi.aliases().stream().anyMatch(alias -> normalizedText.contains(normalize(alias)));
    }

    private int imageMatchCount(List<String> imageLabels, PoiProfile poi) {
        if (imageLabels == null || imageLabels.isEmpty()) {
            return 0;
        }
        Set<String> normalizedLabels = new LinkedHashSet<>();
        for (String label : imageLabels) {
            if (hasText(label)) {
                normalizedLabels.add(normalize(label));
            }
        }
        int count = 0;
        for (String visualLabel : poi.visualLabels()) {
            String normalizedVisualLabel = normalize(visualLabel);
            for (String label : normalizedLabels) {
                if (label.equals(normalizedVisualLabel)
                        || label.contains(normalizedVisualLabel)
                        || normalizedVisualLabel.contains(label)) {
                    count++;
                    break;
                }
            }
        }
        return count;
    }

    private String buildSceneSignalContextText(MultimodalTriggerReqVO reqVO) {
        Map<String, Object> sceneSignals = reqVO.getSceneSignals();
        if (sceneSignals == null || sceneSignals.isEmpty()) {
            return "";
        }
        List<String> values = new ArrayList<>();
        for (String key : SCENE_SIGNAL_CONTEXT_KEYS) {
            Object value = sceneSignals.get(key);
            if (value != null && hasText(value.toString())) {
                values.add(value.toString().trim());
            }
        }
        return String.join(" ", values);
    }

    private String detectSceneSignalIntent(Map<String, Object> sceneSignals) {
        if (sceneSignals == null || sceneSignals.isEmpty()) {
            return "";
        }
        String text = normalize(String.join(" ",
                sceneSignalValue(sceneSignals, "sceneDomainIntentKey"),
                sceneSignalValue(sceneSignals, "sceneDomainIntentLabel"),
                sceneSignalValue(sceneSignals, "sceneDomainIntentTitle")));
        if (containsAny(text, List.of("menu", "food", "restaurant", "cafe", "餐饮", "菜单", "菜品", "美食"))) {
            return "food";
        }
        if (containsAny(text, List.of("route", "navigation", "nextstop", "路线", "导航", "下一站", "行程"))) {
            return "route";
        }
        if (containsAny(text, List.of("travelogue", "record", "checkin", "badge", "游记", "记录", "打卡", "徽章"))) {
            return "record";
        }
        if (containsAny(text, List.of("activity", "performance", "show", "festival", "event", "活动", "演出",
                "节目", "节庆", "表演", "票务", "买票", "预约"))) {
            return "activity";
        }
        if (containsAny(text, List.of("sign", "roadsign", "streetname", "shopsign", "路牌", "街牌",
                "指示牌", "招牌", "翻译", "发音"))) {
            return "translate";
        }
        if (containsAny(text, List.of("animal", "wildlife", "snowleopard", "snow_leopard",
                "动物", "野生动物", "雪豹", "安全提醒", "危险提醒"))) {
            return "safety";
        }
        if (containsAny(text, List.of("artifact", "relic", "bronze", "intangibleheritage",
                "intangible_heritage", "heritagecraft", "plant", "person", "statue", "portrait",
                "文物", "青铜", "器物", "古剑", "非遗", "乐器", "热瓦普", "工艺", "传承",
                "植物", "胡杨", "树", "花", "人物", "雕像", "塑像", "画像"))) {
            return "interpret";
        }
        String agentIntent = detectAgentDecisionIntent(sceneSignals);
        if (hasText(agentIntent)) {
            return agentIntent;
        }
        return detectRealtimeRouteIntent(sceneSignals);
    }

    private String detectAgentDecisionIntent(Map<String, Object> sceneSignals) {
        if (sceneSignals == null || sceneSignals.isEmpty()) {
            return "";
        }
        String text = normalize(String.join(" ",
                sceneSignalValue(sceneSignals, "agentDecisionActionTitle"),
                sceneSignalValue(sceneSignals, "agentDecisionReasonSummary")));
        if (containsAny(text, List.of("活动", "演出", "节目", "票务", "买票", "查看票务", "购票"))) {
            return "activity";
        }
        if (containsAny(text, List.of("翻译", "发音", "路牌", "街牌", "维吾尔文", "文字含义", "怎么读"))) {
            return "translate";
        }
        if (containsAny(text, List.of("安全提醒", "是否危险", "会不会危险", "保持距离", "不要靠近", "不要投喂",
                "野生动物", "雪豹"))) {
            return "safety";
        }
        if (containsAny(text, List.of("深入讲解", "深度讲解", "深度识境", "年代", "工艺", "用途",
                "同时代", "比较", "人物故事", "贡献", "制作过程", "传承", "树龄", "分布", "最佳观赏季"))) {
            return "interpret";
        }
        if (containsAny(text, List.of("先拍照", "拍照建议", "拍照角度", "最佳拍摄", "拍摄时间", "机位",
                "构图", "取景", "夕阳", "日落", "光线适合", "适合拍"))) {
            return "photo";
        }
        if (containsAny(text, List.of("推荐菜", "附近美食", "餐厅", "点餐", "优惠券", "排队", "预约", "清真"))) {
            return "food";
        }
        if (containsAny(text, List.of("下一站", "推荐路线", "路线推荐", "室内路线", "导航", "行程"))) {
            return "route";
        }
        if (containsAny(text, List.of("生成游记", "旅行记录", "加入旅行地图", "完成打卡", "领取徽章", "收集徽章"))) {
            return "record";
        }
        return "";
    }

    private String detectRealtimeRouteIntent(Map<String, Object> sceneSignals) {
        if (sceneSignals == null || sceneSignals.isEmpty()) {
            return "";
        }
        String weatherText = sceneSignalValue(sceneSignals, "weatherText");
        String localTimeText = sceneSignalValue(sceneSignals, "localTimeText");
        String environmentText = normalize(String.join(" ",
                weatherText,
                localTimeText,
                sceneSignalValue(sceneSignals, "temperatureText"),
                sceneSignalValue(sceneSignals, "sceneFusionSummary"),
                sceneSignalValue(sceneSignals, "agentDecisionReasonSummary")));
        if (isOutdoorDiscomfortWeather(environmentText)
                || isHighTemperature(sceneSignals, environmentText)
                || isNightLocalTime(localTimeText)) {
            return "route";
        }
        return "";
    }

    private boolean isOutdoorDiscomfortWeather(String normalizedText) {
        return containsAny(normalizedText, List.of(
                "下雨", "小雨", "中雨", "大雨", "暴雨", "雷阵雨", "雨天", "降雨",
                "下雪", "雪天", "大风", "沙尘", "雾霾", "高温", "酷热", "炎热"));
    }

    private boolean isHighTemperature(Map<String, Object> sceneSignals, String normalizedText) {
        if (containsAny(normalizedText, List.of("35度", "36度", "37度", "38度", "39度", "40度",
                "35℃", "36℃", "37℃", "38℃", "39℃", "40℃"))) {
            return true;
        }
        Double temperature = doubleValue(sceneSignals.get("temperatureCelsius"), Double.NaN);
        return temperature != null && Double.isFinite(temperature) && temperature >= 35D;
    }

    private boolean isNightLocalTime(String localTimeText) {
        String normalizedText = normalize(localTimeText);
        if (containsAny(normalizedText, List.of("夜间", "晚上", "夜游", "夜景", "晚间", "日落后"))) {
            return true;
        }
        Integer hour = parseLocalHour(localTimeText);
        return hour != null && (hour >= 19 || hour <= 5);
    }

    private Integer parseLocalHour(String localTimeText) {
        if (!hasText(localTimeText)) {
            return null;
        }
        int colonIndex = localTimeText.indexOf(':');
        if (colonIndex <= 0) {
            return null;
        }
        String hourText = localTimeText.substring(0, colonIndex).replaceAll("[^0-9]", "");
        if (hourText.length() > 2) {
            hourText = hourText.substring(hourText.length() - 2);
        }
        try {
            int hour = Integer.parseInt(hourText);
            return hour >= 0 && hour <= 23 ? hour : null;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private String sceneSignalValue(Map<String, Object> sceneSignals, String key) {
        Object value = sceneSignals.get(key);
        return value == null ? "" : value.toString();
    }

    private LocationPointReqVO effectiveLocation(MultimodalTriggerReqVO reqVO) {
        if (reqVO.getLocation() != null) {
            return reqVO.getLocation();
        }
        PhotoMetaReqVO photoMeta = reqVO.getPhotoMeta();
        return photoMeta == null ? null : photoMeta.getExifLocation();
    }

    private boolean hasCoordinate(LocationPointReqVO location) {
        return location != null && location.getLatitude() != null && location.getLongitude() != null;
    }

    private Map<String, Object> parseJsonObject(String json) {
        if (!hasText(json)) {
            return Map.of();
        }
        Map<String, Object> parsed = JsonUtils.parseObjectQuietly(json, new TypeReference<>() {
        });
        return parsed == null ? Map.of() : parsed;
    }

    private List<String> parseStringArray(String json) {
        if (!hasText(json)) {
            return List.of();
        }
        List<String> parsed = JsonUtils.parseObjectQuietly(json, new TypeReference<>() {
        });
        return parsed == null ? List.of() : distinctTexts(parsed);
    }

    private List<String> stringListFromValue(Object value) {
        if (!(value instanceof List<?> values)) {
            return List.of();
        }
        List<String> result = new ArrayList<>();
        for (Object item : values) {
            if (item != null) {
                addText(result, item.toString());
            }
        }
        return distinctTexts(result);
    }

    private List<String> distinctTexts(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }
        Set<String> distinctValues = new LinkedHashSet<>();
        for (String value : values) {
            if (hasText(value)) {
                distinctValues.add(value.trim());
            }
        }
        return List.copyOf(distinctValues);
    }

    private List<String> defaultSuggestedQuestions(String poiName) {
        return List.of("给我讲讲" + poiName + "。", poiName + "附近适合怎么逛？", "这里适合亲子研学怎么讲？");
    }

    private void addText(List<String> values, String value) {
        if (hasText(value)) {
            values.add(value.trim());
        }
    }

    private String stringValue(Object value, String fallback) {
        return value == null || !hasText(value.toString()) ? fallback : value.toString().trim();
    }

    private Double doubleValue(BigDecimal value) {
        return value == null ? null : value.doubleValue();
    }

    private double doubleValue(Object value, double fallback) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        if (value != null && hasText(value.toString())) {
            try {
                return Double.parseDouble(value.toString());
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }

    private double haversineMeters(double latitude1, double longitude1, double latitude2, double longitude2) {
        double earthRadiusMeters = 6371000D;
        double dLat = Math.toRadians(latitude2 - latitude1);
        double dLon = Math.toRadians(longitude2 - longitude1);
        double a = Math.sin(dLat / 2D) * Math.sin(dLat / 2D)
                + Math.cos(Math.toRadians(latitude1)) * Math.cos(Math.toRadians(latitude2))
                * Math.sin(dLon / 2D) * Math.sin(dLon / 2D);
        return earthRadiusMeters * 2D * Math.atan2(Math.sqrt(a), Math.sqrt(1D - a));
    }

    private boolean containsAny(String text, List<String> keywords) {
        return keywords.stream().anyMatch(text::contains);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT).replace(" ", "");
    }

    private String defaultIfBlank(String value, String fallback) {
        return hasText(value) ? value.trim() : fallback;
    }

    private String normalizeRegionCode(String regionCode) {
        String normalized = defaultIfBlank(regionCode, REGION_XICHENG).trim();
        String compact = normalized.toLowerCase(Locale.ROOT).replace("_", "-");
        if ("xicheng".equals(compact) || "beijing-xicheng".equals(compact)) {
            return REGION_XICHENG;
        }
        return normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private double round1(double value) {
        return Math.round(value * 10D) / 10D;
    }

    private double round2(double value) {
        return Math.round(value * 100D) / 100D;
    }

    private record PoiProfile(String code, String name, List<String> aliases, List<String> visualLabels,
                              Double latitude, Double longitude, double radiusMeters, String summary,
                              List<String> suggestedQuestions, List<SourceProfile> sources) {
        private boolean hasCoordinate() {
            return latitude != null && longitude != null;
        }
    }

    private record SourceProfile(String title, String sourceType, String sourceUrl, String contentDigest) {
    }

    private record MatchScore(PoiProfile poi, double confidence, Double distanceMeters, List<String> signals) {
    }

}
