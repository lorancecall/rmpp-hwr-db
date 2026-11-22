# rmpp-hwr-db

An **open handwriting dataset built by the reMarkable community.** People who write on a reMarkable Paper Pro fill
in short practice notebooks in their own language and share them as pen strokes (coordinates, pressure, width),
with the printed text of every cell and line. Free for any use under CC BY 4.0: handwriting recognition, note
apps, other tablets, research, teaching.

### **[Join as a writer →](https://lorancecall.github.io/rmpp-hwr-db/)**

The site walks you through it in every supported language (e.g. [한국어](https://lorancecall.github.io/rmpp-hwr-db/?lang=ko)).

> It feeds [rmpp-hwr](https://github.com/lorancecall/rmpp-hwr), handwriting recognition on the tablet: one of the
> **rmpp add-ons**, built on [rmpp-packages](https://github.com/lorancecall/rmpp-packages). Anyone else is welcome
> to use the data too.

## How contributions work

You write rmpp-hwr's practice pages on the tablet and send them with `hwr contribute` (it opens a pull request
with anonymized data: a random writer id, no names, accounts or devices); on the site anyone can also send
practice sentences or ask for a new language. Everything is published under CC BY 4.0. Details:
[CONTRIBUTING.md](CONTRIBUTING.md).

## Use the data

- `data/<language>/<writer>/<session>/page-NN.json`, one file per page: [FORMAT.md](FORMAT.md)
- Practice sentences: `texts/<code>.tsv` ([FORMAT.md](FORMAT.md#practice-sentences-textscodetsv))
- Languages and numbers per language: [languages.json](languages.json) and the [site](https://lorancecall.github.io/rmpp-hwr-db/)
- Hugging Face mirror: [datasets/lorancecall/rmpp-hwr-db](https://huggingface.co/datasets/lorancecall/rmpp-hwr-db)

## More

- [CONTRIBUTING.md](CONTRIBUTING.md): joining, languages, practice sentences, what the bots check
- [PRIVACY.md](PRIVACY.md): what the data holds, what is public, withdrawal

## License

The data and the practice sentences are [CC BY 4.0](LICENSE). Please credit "rmpp-hwr-db contributors" and this
repository.

---

**한국어.** reMarkable 커뮤니티가 함께 만드는 공개 손글씨 데이터셋입니다. 태블릿에서 내 언어로 짧은 연습 노트를 쓰고 펜 획
그대로 공유하면 누구나 자유롭게 쓸 수 있습니다(CC BY 4.0). 참여: [한국어 안내](https://lorancecall.github.io/rmpp-hwr-db/?lang=ko).
