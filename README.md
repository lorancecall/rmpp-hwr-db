# rmpp-hwr-db

reMarkable Paper Pro에서 쓴 **한국어·영어·숫자 손글씨 공개 데이터셋**입니다. 참여자가 정형화된 연습 페이지에
쓴 손글씨를 펜 획(좌표, 압력, 굵기) 그대로 모읍니다. 글자 단위 칸으로 나뉘어 있어서 줄 단위와 글자 단위 학습에 모두 쓸 수 있습니다.
이 데이터로 [rmpp-hwr](https://github.com/lorancecall/rmpp-hwr) 손글씨 인식 모델을 꾸준히 학습시켜 배포하는 것이 목표입니다.

- **참여 안내 (한국어)**: https://lorancecall.github.io/rmpp-hwr-db/
- **참여 신청**: [이슈 양식](https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=join.yml)
- **데이터 형식**: [FORMAT.md](FORMAT.md)
- **Hugging Face 미러**: https://huggingface.co/datasets/lorancecall/rmpp-hwr-db

## 개인정보

데이터에는 무작위 작성자 ID, 연습 템플릿, 펜 획만 들어갑니다. 이름, 계정, 기기 정보, 문서 ID, 작성 시각은 없습니다.
모든 PR은 자동 검사(`scripts/validate.py`)를 거칩니다. 검사 항목은 허용된 항목만 있는지(허용 목록 방식), 이메일·URL·전화번호 같은 패턴이 없는지, 동의 이슈가 있는지입니다.
다만 참여 신청 이슈와 PR을 연 GitHub 계정은 GitHub 특성상 공개됩니다.

## 라이선스

데이터는 [CC BY 4.0](LICENSE)입니다. 사용할 때 "rmpp-hwr-db contributors"와 이 저장소를 출처로 밝혀 주세요.

---

**English.** An open dataset of Korean, English and digit handwriting written on the reMarkable Paper Pro. The
pages are structured practice sheets with per-character cells, and the data is stored as pen strokes. Contributors join
through the consent issue form and submit pages with `hwr contribute` from
[rmpp-hwr](https://github.com/lorancecall/rmpp-hwr). The data carries only random writer ids, no personal data.
License: CC BY 4.0. Format: [FORMAT.md](FORMAT.md).
