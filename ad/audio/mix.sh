#!/bin/zsh
set -eu
if (( $# != 4 )); then
  print -u2 "Usage: mix.sh video_in out.mp4 LENGTH TAG_START"
  exit 2
fi
# usage: mix.sh video_in out.mp4 LENGTH TAG_START
V=$1; OUT=$2; L=$3; T=$4
A="${0:A:h}"
ms(){ python3 -c "print(int(round($1*1000)))"; }
FO=$(python3 -c "print($L-0.7)")
ffmpeg -v error -y -i "$V" -i $A/beat.mp3 -i $A/sfx_lighter.mp3 -i $A/sfx_exhale.mp3 -i $A/vo_seed.mp3 -filter_complex "\
[1:a]atrim=0:$L,asetpts=PTS-STARTPTS,volume=0.55[beat];\
[2:a]atrim=0.2:3.8,asetpts=PTS-STARTPTS,afade=t=out:st=2.8:d=0.8,volume=1.6,adelay=100|100[lit];\
[3:a]atrim=0.4:5.2,asetpts=PTS-STARTPTS,afade=t=in:d=0.15,afade=t=out:st=3.6:d=1.2,volume=1.1,adelay=3400|3400[exh];\
[4:a]asplit=4[v1][v2][v3][v4];\
[v1]atrim=0:2.25,asetpts=PTS-STARTPTS,afade=t=out:st=2.1:d=0.15,adelay=6100|6100[s1];\
[v2]atrim=2.45:3.3,asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st=0.7:d=0.15,adelay=8500|8500[s2];\
[v3]atrim=4.6:5.7,asetpts=PTS-STARTPTS,afade=t=in:d=0.05,afade=t=out:st=0.95:d=0.15,volume=1.5,adelay=9300|9300[s3];\
[v4]atrim=8.6:11.0,asetpts=PTS-STARTPTS,afade=t=in:d=0.05,adelay=$(ms $T)|$(ms $T)[s4];\
[s1][s2][s3][s4]amix=inputs=4:normalize=0,volume=1.5,asplit=2[vo][key];\
[beat][key]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=300[duck];\
[duck][lit][exh][vo]amix=inputs=4:normalize=0,alimiter=limit=0.95,atrim=0:$L,afade=t=out:st=$FO:d=0.7[aout]" \
-map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "$OUT"
