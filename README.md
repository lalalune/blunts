# Blunts

Interactive investing concept, founder brief, research, and creative tooling.
The prototypes simulate balances, funding, bank linking, and withdrawals in memory;
refreshing resets them. No payment or brokerage integration is connected.

## Run locally

From this directory:

```sh
python3 -m http.server 8731 --bind 127.0.0.1
```

- [Current 3D prototype](http://localhost:8731/prototype/)
- [Earlier flat prototype](http://localhost:8731/prototype/v1-flat.html)
- [Founder brief](http://localhost:8731/brief/)

The current prototype needs WebGL and loads Three.js r128 and fonts from CDNs.
Press **D** for demo controls (market changes, empty/sample balances, funding
methods, profit cut). Escape or clicking outside a sheet dismisses it and cancels
its pending simulated payment. Use Fill to add and Spark to withdraw.

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
