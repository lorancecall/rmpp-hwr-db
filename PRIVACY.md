# Privacy

## What the data holds

A random writer id (a UUID made once on the contributor's PC, not derived from any account, device or name), the
practice template and the pen strokes. No names, accounts, device information, document ids, file names or times.
Writers only copy the sentences printed on the practice pages, never their own notes.

## What is checked

Every pull request is checked by `scripts/validate.py`: allow-listed fields only, no e-mail, URL or phone-number
patterns, and an approved consent issue for the writer. Practice sentences go through similar checks
(`scripts/sentences.py`).

## What is public

The GitHub account that opens the join issue and the pull request is public, as on any GitHub project. You can use
a separate GitHub account for this project if you prefer.

## Withdrawal

Ask with the [withdrawal form](https://github.com/lorancecall/rmpp-hwr-db/issues/new?template=withdraw.yml) from the same GitHub account you joined with; your writer id is in `hwr-data/writer.json`
on your PC. Your data is removed from the next version of the dataset and of the Hugging Face mirror. Earlier
published versions and copies others already downloaded cannot be recalled.
