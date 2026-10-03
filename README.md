# Blunts

A browser wallet sandbox with durable accounts, a complete simulated investment
cycle, a PostgreSQL-compatible backend, research and creative prototypes.

**No live money:** MoonPay/Cash App, Dinari and real wallets are not connected.
See the [implementation and remaining launch gates](docs/browser-implementation.md).

## Run the browser app

Requires Node 24.

```sh
npm ci
npm run build
npm start
```

Open [Blunts](http://localhost:8740). Create a test account, save its recovery
code, then Add USDC → Fill → Spark → Withdraw. Add a simulated destination in
Settings before withdrawing. Records survive refresh and server restart.

The default file-backed PostgreSQL store lives in ignored `data/blunts/`.
Set `DATABASE_URL` for server PostgreSQL. The existing creative-tools `.env` is
not loaded. [Configuration](infra/sandbox.env.example) and
[backup/recovery instructions](docs/browser-implementation.md) are provided.

```sh
npm run build
npm test
npx playwright install chromium webkit
npm run test:e2e
npm run format:check
```

## Historical visual prototypes

The original prototypes use in-memory balances and a different financial model.
They are creative references, not the application implementation. To view one,
serve only its directory rather than the repository root:

```sh
python3 -m http.server 8731 --bind 127.0.0.1 --directory prototype
```

- [3D prototype](http://localhost:8731/)
- [Earlier flat prototype](http://localhost:8731/v1-flat.html)

## Current launch research

Start with the [October 2 research dossier](research/2026-10-02/README.md) for
market/economics, Cash App/EVM/Solana feasibility, legal gates, UI/technical
findings, publishing requirements and the detailed implementation plan. It
supersedes unverified launch assumptions in the historical research.

## Research model

```sh
python3 research/2026-10-02/business_model.py
# Historical model (preserved for reference):
python3 research/model/market_model.py
python3 -m unittest discover -s tests
node --test tests/prototype.test.cjs
```

Research documents preserve planning assumptions and sources; they are not verified
provider integrations. The prototype's profit-cut model and the research model's
per-move fees are separate experiments.

## Creative tools

Install `requirements.txt` in a virtual environment. Set `OPENROUTER_API_KEY` in
your environment (see `.env.example`). These commands call paid external APIs:

```sh
python3 ad/img.py MODEL output.png 'Prompt' [reference.png ...]
python3 ad/sub.py NAME reference.png SECONDS 'Prompt'
python3 ad/anime/sub_anime.py NAME reference.png SECONDS 'Prompt'
python3 ad/anime/poll.py NAME
python3 ad/audio/tts.py voice.mp3 '{"model":"MODEL","input":"Script","voice":"VOICE"}'
zsh ad/audio/mix.sh input.mp4 output.mp4 30 26
```

Video job files and clips are written to the working directory; run polling from
that same directory. Check an existing job before resubmitting after a timeout.
Audio mixing requires FFmpeg and `beat.mp3`, `sfx_lighter.mp3`, `sfx_exhale.mp3`,
and `vo_seed.mp3` alongside `mix.sh`. Generated media, provider responses, and
credentials are ignored by Git and remain local. Ad prompts are tracked.
