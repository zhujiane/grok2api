## 上传 文件 
curl --url 'https://grok.com/http/upload-file-v2/direct' 

返回值
{
    "uploadId": "328611c0-8541-45f2-9744-09107d550779",
    "fileMetadata": {
        "fileMetadataId": "98c7d509-b35b-4f02-bfc4-083d38640f3f",
        "fileMimeType": "image/png",
        "fileName": "image.png",
        "fileUri": "users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
        "parsedFileUri": "",
        "createTime": "2026-09-09T02:24:39.178332549Z",
        "fileSource": "SELF_UPLOAD_FILE_SOURCE"
    }
}  

##
curl --url 'https://grok.com/rest/assets/98c7d509-b35b-4f02-bfc4-083d38640f3f' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'baggage: sentry-environment=production,sentry-release=grok-web%4061cadf5adf6535d7857484e3b20536590ff7a675,sentry-public_key=b311e0f2690c81f25e2c4cf6d4f7ce1c,sentry-trace_id=8380ca00c25b45d593c51c41025dc02f,sentry-org_id=4508179396558848,sentry-sampled=false,sentry-sample_rand=0.9024951159948851,sentry-sample_rate=0' \
  -b 'grok_device_id=6a60e7cc-85fa-46be-bb46-ac480df98608; cf_clearance=L3gFi6fpAZUfN139YqkozivMEVxnf2fiOC483UC36oA-1788917240-1.2.1.1-8RAJ1c0xmkMs1vQoDZnQAQFFOCaeQ4Ls6_CdRh4WYBS_ddyraZxNtFI1KmGrDAXleO5NK2mYs9mS9_VjtFJKN.4OA8x5RU9eMZ_pVItJNYxvaPo2d_lKs3hF0K98zlc5DCUN1ajfD7ditXVDBMEOM1RX74o6_JeQn7UpR8NGvgwxYZfOLeomnetcFuBvebwz_FVU6Yi80ripEUYSjvdVu4BBRMKEWXKvEOwZ5UA5Ja5191xs2bLVuGoDaJuzkJMPLqoobMpWAZuviIyXwsNxiN6saAdbo8X8gVlHQnw0O01M3_OEvkMb7WjTcdLcjktD5q1yHCnd1EbaP7qm6hLjUD0cMtNabuKn4_inNcEDN3k; i18nextLng=en; __cuid=9255f92e-efbd-40ea-9c9e-75abcc89f6e0; __cuid=9255f92e-efbd-40ea-9c9e-75abcc89f6e0; __stripe_mid=c9c6c8ce-43c7-4b2a-b9ca-9d0b0013242afd40ea; sso-rw=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiZTZjZTFkNWUtYWE5OC00ZGNlLWJhOTUtZmU3NzMxM2U2NzdkIn0.ty6VbZtiDu3ED3M3wb5ZExyujZJxpg2JDrg0CvZIrkc; sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiZTZjZTFkNWUtYWE5OC00ZGNlLWJhOTUtZmU3NzMxM2U2NzdkIn0.ty6VbZtiDu3ED3M3wb5ZExyujZJxpg2JDrg0CvZIrkc; x-userid=d20b788a-dd4f-42ab-8a1a-8a983e23559e; OptanonAlertBoxClosed=2026-09-09T01:28:30.552Z; _twpid=tw.1788917325029.293773486171031233; mp_ea93da913ddb66b6372b89d97b1029ac_mixpanel=%7B%22distinct_id%22%3A%22d20b788a-dd4f-42ab-8a1a-8a983e23559e%22%2C%22%24device_id%22%3A%22037cc606-e32a-4692-8ad9-525e5f23329b%22%2C%22%24initial_referrer%22%3A%22%24direct%22%2C%22%24initial_referring_domain%22%3A%22%24direct%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%2C%22%24user_id%22%3A%22d20b788a-dd4f-42ab-8a1a-8a983e23559e%22%7D; OptanonConsent=isGpcEnabled=0&datestamp=Wed+Sep+09+2026+09%3A29%3A45+GMT%2B0800+(China+Standard+Time)&version=202603.1.0&browserGpcFlag=0&isDntEnabled=0&isIABGlobal=false&hosts=&consentId=d20b788a-dd4f-42ab-8a1a-8a983e23559e&interactionCount=2&isAnonUser=0&prevHadToken=0&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1%2CBG35%3A1&crTime=1788917311204&intType=9&geolocation=US%3BCA&AwaitingReconsent=false; __cf_bm=C6VofbiWBaUu_EZ_Ut02hySXb8TkBQvyA5jCg2cB6Hk-1788920759.7491817-1.0.1.1-3OGNC4kZpKOoOZeLbI5TXfVuciiQ.F_ejSAGTTM_8j9uVdfn_BWf4bwXZxfOG_VccYWLNBoWYDpFnnjAKaps_WUFTlRDM10mExfLidx9zRIMyf6VCED8f7ZaRwewdegP; _gcl_au=1.1.1646344579.1788917311.-.-.1788917324.1005124804.1788917325.1788920765' \
  -H 'priority: u=1, i' \
  -H 'referer: https://grok.com/imagine' \
  -H 'sec-ch-ua: "Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'sentry-trace: 8380ca00c25b45d593c51c41025dc02f-86a33a82ad84a7a9-0' \
  -H 'traceparent: 00-da8b3cbec12607cad7a8f12627cb9898-0d96aa45cd8a9fa2-00' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36' \
  -H 'x-statsig-id: OPh/YmvwmUbZUbEPHQW9kekEN6oaPiRX7jX4dI+MxSM0hr0sy5NLVP13crWn5ig4L9RYaT7/DMESiayvTQMeBvLWK5W+Ow' \
  -H 'x-xai-request-id: 8088b72d-ff37-4689-9f97-641154b2322d'


  返回值
  {
    "assetId": "98c7d509-b35b-4f02-bfc4-083d38640f3f",
    "mimeType": "image/png",
    "name": "image.png",
    "sizeBytes": 1089437,
    "createTime": "2026-09-09T02:24:39.178Z",
    "lastUseTime": "2026-09-09T02:24:39.178Z",
    "summary": "",
    "previewImageKey": "",
    "key": "users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
    "auxKeys": {
        "image_edit_is_root_user_uploaded": "true",
        "r_rated": "false",
        "thumbhash": "4vcRBQBsiJ+HV3e4h3eHl/SXqD+e"
    },
    "isDeleted": false,
    "fileSource": "IMAGINE_SELF_UPLOAD_FILE_SOURCE",
    "rootAssetId": "98c7d509-b35b-4f02-bfc4-083d38640f3f",
    "isModelGenerated": false,
    "updateTime": "2026-09-09T02:24:39.178Z",
    "isLatest": true,
    "inlineStatus": "DEFAULT_ARTIFACT_INLINE_STATUS",
    "isRootAssetCreatedByModel": false,
    "sharedWithTeam": false,
    "sharedWithUserIds": [],
    "isPublic": false,
    "thumbhash": "4vcRBQBsiJ+HV3e4h3eHl/SXqD+e",
    "ownerUserId": "d20b788a-dd4f-42ab-8a1a-8a983e23559e"
}


## 
curl --url 'https://grok.com/rest/app-chat/conversations/new' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'baggage: sentry-environment=production,sentry-release=grok-web%4061cadf5adf6535d7857484e3b20536590ff7a675,sentry-public_key=b311e0f2690c81f25e2c4cf6d4f7ce1c,sentry-trace_id=8380ca00c25b45d593c51c41025dc02f,sentry-org_id=4508179396558848,sentry-sampled=false,sentry-sample_rand=0.9024951159948851,sentry-sample_rate=0' \
  -H 'content-type: application/json' \
  -b 'grok_device_id=6a60e7cc-85fa-46be-bb46-ac480df98608; cf_clearance=L3gFi6fpAZUfN139YqkozivMEVxnf2fiOC483UC36oA-1788917240-1.2.1.1-8RAJ1c0xmkMs1vQoDZnQAQFFOCaeQ4Ls6_CdRh4WYBS_ddyraZxNtFI1KmGrDAXleO5NK2mYs9mS9_VjtFJKN.4OA8x5RU9eMZ_pVItJNYxvaPo2d_lKs3hF0K98zlc5DCUN1ajfD7ditXVDBMEOM1RX74o6_JeQn7UpR8NGvgwxYZfOLeomnetcFuBvebwz_FVU6Yi80ripEUYSjvdVu4BBRMKEWXKvEOwZ5UA5Ja5191xs2bLVuGoDaJuzkJMPLqoobMpWAZuviIyXwsNxiN6saAdbo8X8gVlHQnw0O01M3_OEvkMb7WjTcdLcjktD5q1yHCnd1EbaP7qm6hLjUD0cMtNabuKn4_inNcEDN3k; i18nextLng=en; __cuid=9255f92e-efbd-40ea-9c9e-75abcc89f6e0; __cuid=9255f92e-efbd-40ea-9c9e-75abcc89f6e0; __stripe_mid=c9c6c8ce-43c7-4b2a-b9ca-9d0b0013242afd40ea; sso-rw=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiZTZjZTFkNWUtYWE5OC00ZGNlLWJhOTUtZmU3NzMxM2U2NzdkIn0.ty6VbZtiDu3ED3M3wb5ZExyujZJxpg2JDrg0CvZIrkc; sso=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzZXNzaW9uX2lkIjoiZTZjZTFkNWUtYWE5OC00ZGNlLWJhOTUtZmU3NzMxM2U2NzdkIn0.ty6VbZtiDu3ED3M3wb5ZExyujZJxpg2JDrg0CvZIrkc; x-userid=d20b788a-dd4f-42ab-8a1a-8a983e23559e; OptanonAlertBoxClosed=2026-09-09T01:28:30.552Z; _twpid=tw.1788917325029.293773486171031233; mp_ea93da913ddb66b6372b89d97b1029ac_mixpanel=%7B%22distinct_id%22%3A%22d20b788a-dd4f-42ab-8a1a-8a983e23559e%22%2C%22%24device_id%22%3A%22037cc606-e32a-4692-8ad9-525e5f23329b%22%2C%22%24initial_referrer%22%3A%22%24direct%22%2C%22%24initial_referring_domain%22%3A%22%24direct%22%2C%22__mps%22%3A%7B%7D%2C%22__mpso%22%3A%7B%7D%2C%22__mpus%22%3A%7B%7D%2C%22__mpa%22%3A%7B%7D%2C%22__mpu%22%3A%7B%7D%2C%22__mpr%22%3A%5B%5D%2C%22__mpap%22%3A%5B%5D%2C%22%24user_id%22%3A%22d20b788a-dd4f-42ab-8a1a-8a983e23559e%22%7D; OptanonConsent=isGpcEnabled=0&datestamp=Wed+Sep+09+2026+09%3A29%3A45+GMT%2B0800+(China+Standard+Time)&version=202603.1.0&browserGpcFlag=0&isDntEnabled=0&isIABGlobal=false&hosts=&consentId=d20b788a-dd4f-42ab-8a1a-8a983e23559e&interactionCount=2&isAnonUser=0&prevHadToken=0&landingPath=NotLandingPage&groups=C0001%3A1%2CC0002%3A1%2CC0003%3A1%2CC0004%3A1%2CBG35%3A1&crTime=1788917311204&intType=9&geolocation=US%3BCA&AwaitingReconsent=false; __cf_bm=C6VofbiWBaUu_EZ_Ut02hySXb8TkBQvyA5jCg2cB6Hk-1788920759.7491817-1.0.1.1-3OGNC4kZpKOoOZeLbI5TXfVuciiQ.F_ejSAGTTM_8j9uVdfn_BWf4bwXZxfOG_VccYWLNBoWYDpFnnjAKaps_WUFTlRDM10mExfLidx9zRIMyf6VCED8f7ZaRwewdegP; _gcl_au=1.1.1646344579.1788917311.-.-.1788917324.1005124804.1788917325.1788920765' \
  -H 'origin: https://grok.com' \
  -H 'priority: u=1, i' \
  -H 'referer: https://grok.com/imagine' \
  -H 'sec-ch-ua: "Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'sentry-trace: 8380ca00c25b45d593c51c41025dc02f-84ba0c207a128ca4-0' \
  -H 'traceparent: 00-78fd6c89f05a1e281baed723631f1a16-8c8d9a726b986e1d-00' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36' \
  -H 'x-statsig-id: gkLF2NFKI/xj6wu1p78HK1O+jRCghJ7tVI9CzjU2f5mOPAeWcSnx7kfNyA8dXJKClW7i04TzW5vDdLeKEDakQ0CzEN74gQ' \
  -H 'x-xai-request-id: 5800ba72-4609-45f3-b0cb-39a780e6660b' \
  --data-raw '{"modelName":"imagine-video-gen","message":"**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。 --mode=custom","enableImageStreaming":true,"enableSideBySide":true,"sendFinalMetadata":true,"responseMetadata":{"experiments":[],"modelConfigOverride":{"modelMap":{}}},"mediaGenInput":{"imageToVideo":{"prompt":"**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。","inputAssets":["98c7d509-b35b-4f02-bfc4-083d38640f3f"],"aspectRatio":"9:16","duration":6,"resolutionName":"480p","mode":"custom"}},"kind":"CONVERSATION_KIND_IMAGINE"}'

  返回值
  {
    "result": {
        "conversation": {
            "conversationId": "62b80ba4-047f-4e76-89e2-3b3988135c85",
            "title": "New conversation",
            "starred": false,
            "createTime": "2026-09-09T02:28:45.123407Z",
            "modifyTime": "2026-09-09T02:28:45.124037Z",
            "systemPromptName": "",
            "temporary": false,
            "mediaTypes": [],
            "workspaces": [],
            "taskResult": null,
            "latestAssetMetadata": null,
            "viewerIsOwner": true,
            "kind": "CONVERSATION_KIND_IMAGINE"
        }
    }
}{
    "result": {
        "response": {
            "userResponse": {
                "responseId": "27af5a7f-8a8f-4441-b8b0-51ec937cc7ec",
                "message": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。 --mode=custom",
                "sender": "human",
                "createTime": "2026-09-09T02:28:45.156Z",
                "manual": false,
                "partial": false,
                "shared": false,
                "query": "",
                "queryType": "",
                "webSearchResults": [],
                "xpostIds": [],
                "xposts": [],
                "generatedImageUrls": [],
                "imageAttachments": [],
                "fileAttachments": [
                    "98c7d509-b35b-4f02-bfc4-083d38640f3f"
                ],
                "cardAttachmentsJson": [],
                "fileUris": [],
                "fileAttachmentsMetadata": [],
                "isControl": false,
                "steps": [],
                "imageEditUris": [],
                "mediaTypes": [],
                "webpageUrls": [],
                "metadata": {
                    "experiments": [],
                    "modelConfigOverride": {
                        "modelMap": {
                            "videoGenModelConfig": {
                                "appliedModerationRule": "MODERATION_RULE_UPLOADED",
                                "aspectRatio": "9:16",
                                "imageReferences": [
                                    "https://assets.grok.com/users/_/98c7d509-b35b-4f02-bfc4-083d38640f3f/content"
                                ],
                                "isRootCelebrity": false,
                                "isRootUserUploaded": true,
                                "isVideoExtension": false,
                                "isVideoRemix": false,
                                "parentPostId": null,
                                "resolutionName": "480p",
                                "resolvedImageReferences": [
                                    "https://assets.grok.com/users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content"
                                ],
                                "videoLength": 6
                            }
                        }
                    }
                },
                "citedWebSearchResults": [],
                "toolResponses": [],
                "model": "imagine-video-gen",
                "ragResults": [],
                "citedRagResults": [],
                "searchProductResults": [],
                "connectorSearchResults": [],
                "collectionSearchResults": [],
                "streamErrors": [],
                "citedXposts": [],
                "citedConnectorSearchResults": [],
                "citedCollectionSearchResults": [],
                "inputChunks": [],
                "outputChunks": [],
                "mediaGenInput": {
                    "imageToVideo": {
                        "prompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                        "inputAssets": [
                            "98c7d509-b35b-4f02-bfc4-083d38640f3f"
                        ],
                        "aspectRatio": "9:16",
                        "duration": 6,
                        "resolutionName": "480p",
                        "modelName": "imagine-video-gen",
                        "mode": "custom",
                        "skipAudio": false
                    }
                },
                "fileAttachmentAssetMetadata": [],
                "fileIds": []
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "27af5a7f-8a8f-4441-b8b0-51ec937cc7ec"
        }
    }
}{
    "result": {
        "response": {
            "progressReport": {
                "category": "PROGRESS_REPORT_CATEGORY_ATTACHMENTS_PREPROCESSING",
                "state": "PROGRESS_REPORT_STATUS_PENDING",
                "message": "Started pre-processing attachments"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "progressReport": {
                "category": "PROGRESS_REPORT_CATEGORY_ATTACHMENTS_PREPROCESSING",
                "state": "PROGRESS_REPORT_STATUS_SUCCESS",
                "message": "Finished pre-processing attachments"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "queryAction": {
                "query": "",
                "type": "imagine"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "imageAttachmentInfo": {
                "imageAttachmentCount": 1
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "streamingVideoGenerationResponse": {
                "videoId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "progress": 1,
                "audioUrls": [],
                "videoPrompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                "imageReference": "https://assets.grok.com/users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
                "audioTranscripts": [],
                "moderated": false,
                "mode": "custom",
                "videoPostId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "height": 672,
                "width": 448,
                "resolutionName": "480p"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "streamingVideoGenerationResponse": {
                "videoId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "progress": 5,
                "audioUrls": [],
                "videoPrompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                "imageReference": "https://assets.grok.com/users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
                "audioTranscripts": [],
                "moderated": false,
                "mode": "custom",
                "videoPostId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "height": 672,
                "width": 448,
                "resolutionName": "480p"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "streamingVideoGenerationResponse": {
                "videoId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "progress": 16,
                "audioUrls": [],
                "videoPrompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                "imageReference": "https://assets.grok.com/users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
                "audioTranscripts": [],
                "moderated": false,
                "mode": "custom",
                "videoPostId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "height": 672,
                "width": 448,
                "resolutionName": "480p"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "streamingVideoGenerationResponse": {
                "videoId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "progress": 33,
                "audioUrls": [],
                "videoPrompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                "imageReference": "https://assets.grok.com/users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
                "audioTranscripts": [],
                "moderated": false,
                "mode": "custom",
                "videoPostId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "height": 672,
                "width": 448,
                "resolutionName": "480p"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "streamingVideoGenerationResponse": {
                "videoId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "progress": 50,
                "audioUrls": [],
                "videoPrompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                "imageReference": "https://assets.grok.com/users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
                "audioTranscripts": [],
                "moderated": false,
                "mode": "custom",
                "videoPostId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "height": 672,
                "width": 448,
                "resolutionName": "480p"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "streamingVideoGenerationResponse": {
                "videoId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "progress": 66,
                "audioUrls": [],
                "videoPrompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                "imageReference": "https://assets.grok.com/users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
                "audioTranscripts": [],
                "moderated": false,
                "mode": "custom",
                "videoPostId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "height": 672,
                "width": 448,
                "resolutionName": "480p"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "streamingVideoGenerationResponse": {
                "videoId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "progress": 94,
                "audioUrls": [],
                "videoPrompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                "imageReference": "https://assets.grok.com/users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
                "audioTranscripts": [],
                "moderated": false,
                "mode": "custom",
                "videoPostId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "height": 672,
                "width": 448,
                "resolutionName": "480p"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "streamingVideoGenerationResponse": {
                "videoId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "progress": 95,
                "audioUrls": [],
                "videoPrompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                "imageReference": "https://assets.grok.com/users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
                "audioTranscripts": [],
                "moderated": false,
                "mode": "custom",
                "videoPostId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "height": 672,
                "width": 448,
                "resolutionName": "480p"
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "streamingVideoGenerationResponse": {
                "videoId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "progress": 100,
                "assetId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "videoUrl": "users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/generated/851a4030-56ad-40df-b6a1-2c5a7916d82c/generated_video.mp4",
                "audioUrls": [],
                "videoPrompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                "imageReference": "https://assets.grok.com/users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/98c7d509-b35b-4f02-bfc4-083d38640f3f/content",
                "audioTranscripts": [],
                "moderated": false,
                "mode": "custom",
                "thumbnailImageUrl": "users/d20b788a-dd4f-42ab-8a1a-8a983e23559e/generated/851a4030-56ad-40df-b6a1-2c5a7916d82c/preview_image.jpg",
                "videoPostId": "851a4030-56ad-40df-b6a1-2c5a7916d82c",
                "rRated": false,
                "height": 672,
                "width": 448,
                "resolutionName": "480p",
                "isRootUserUploaded": true
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "token": "I generated a video with the prompt: '**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。'",
            "isThinking": false,
            "isSoftStop": true,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "response": {
            "modelResponse": {
                "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c",
                "message": "I generated a video with the prompt: '**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。'",
                "sender": "ASSISTANT",
                "createTime": "2026-09-09T02:29:08.776Z",
                "parentResponseId": "27af5a7f-8a8f-4441-b8b0-51ec937cc7ec",
                "manual": false,
                "partial": false,
                "shared": false,
                "query": "",
                "queryType": "imagine",
                "webSearchResults": [],
                "xpostIds": [],
                "xposts": [],
                "generatedImageUrls": [],
                "imageAttachments": [],
                "fileAttachments": [
                    "851a4030-56ad-40df-b6a1-2c5a7916d82c"
                ],
                "cardAttachmentsJson": [],
                "fileUris": [],
                "fileAttachmentsMetadata": [],
                "isControl": false,
                "steps": [],
                "imageEditUris": [],
                "mediaTypes": [],
                "webpageUrls": [],
                "metadata": {
                    "deepsearchPreset": "",
                    "request_metadata": {
                        "effort": "high",
                        "mode": "imagine",
                        "model": "imagine-video-gen"
                    },
                    "request_trace_id": "78fd6c89f05a1e281baed723631f1a16"
                },
                "thinkingStartTime": "2026-09-09T02:28:45.248Z",
                "thinkingEndTime": "2026-09-09T02:29:08.772Z",
                "citedWebSearchResults": [],
                "toolResponses": [],
                "model": "imagine-video-gen",
                "requestMetadata": {
                    "model": "imagine-video-gen",
                    "mode": "MODEL_MODE_UNKNOWN",
                    "effort": "HIGH"
                },
                "ragResults": [],
                "citedRagResults": [],
                "searchProductResults": [],
                "connectorSearchResults": [],
                "collectionSearchResults": [],
                "streamErrors": [],
                "citedXposts": [],
                "citedConnectorSearchResults": [],
                "citedCollectionSearchResults": [],
                "inputChunks": [],
                "outputChunks": [],
                "mediaGenInput": {
                    "imageToVideo": {
                        "prompt": "**广告词（高级感向）**\n主标语：银淬山泉，水合未来。  \n副标语：润田银系列 · 重新定义卓越水合。\n金句：源自地球深层的纯净力量，科技与自然的完美交响。每一次啜饮，都是通往未来的桥梁。pH 7.2 精准平衡，为追求卓越的你量身打造。\n（可搭配英文：HYDRATE. EVOLVE. TRANSCEND.）\n---\n**10秒视频中文 Prompt（突出高级感、电影级质感）**\n一部10秒高端奢华矿泉水广告，电影级4K超高清，银白灰蓝冷调，极致高级、极简、科技与自然融合。慢动作、柔和体积光、细腻水珠与金属反光。\n0-3秒：清晨薄雾缭绕的巍峨山脉，阳光穿透云层洒向深谷泉源，镜头缓慢推进，水雾轻盈流动，营造纯净、神秘、高级氛围。\n3-7秒：切至特写——银色金属质感润田银系列矿泉水瓶静立于湿润岩石上，瓶身布满晶莹水珠，底部几何水晶切割面折射璀璨银光，如钻石般闪耀。镜头缓慢环绕瓶身，展现“润田 YUN TIAN 银系列”“pH 7.2”字样，背景山脉若隐若现。\n7-10秒：瓶盖微启，一滴纯净水珠缓缓落下，画面定格。叠加优雅文字：“银淬山泉，水合未来” + “重新定义未来水合”。整体光影高级、质感奢华，无人物、无杂乱元素。\n风格参考：高端珠宝/香水广告质感，自然与未来科技完美融合，氛围静谧、克制、高级。",
                        "inputAssets": [
                            "98c7d509-b35b-4f02-bfc4-083d38640f3f"
                        ],
                        "aspectRatio": "9:16",
                        "duration": 6,
                        "resolutionName": "480p",
                        "modelName": "imagine-video-gen",
                        "mode": "custom",
                        "skipAudio": false
                    }
                },
                "fileAttachmentAssetMetadata": [],
                "fileIds": []
            },
            "isThinking": false,
            "isSoftStop": false,
            "responseId": "b4d1f704-3d61-41ce-98a5-267ecdfd831c"
        }
    }
}{
    "result": {
        "title": {
            "newTitle": "New conversation"
        }
    }
}