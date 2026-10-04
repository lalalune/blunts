"""Generate native launch assets from the existing typographic Blunts identity.
Requires Pillow; does not call an image generation service.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import os
font_path = os.environ.get('BLUNTS_FONT', '/System/Library/Fonts/Supplemental/Arial Bold.ttf')
def icon(size, foreground=False):
    image = Image.new('RGBA', (size,size), (0,0,0,0) if foreground else '#10150e')
    draw=ImageDraw.Draw(image); font=ImageFont.truetype(font_path, int(size*(.4 if foreground else .6)))
    box=draw.textbbox((0,0),'b$',font=font); draw.text(((size-(box[2]-box[0]))/2, (size-(box[3]-box[1]))/2-box[1]),'b$',font=font,fill='#c2dd8c')
    return image
icon(1024).convert('RGB').save('ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
for density,size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    directory=Path('android/app/src/main/res')/('mipmap-'+density)
    for name in ['ic_launcher.png','ic_launcher_round.png']: icon(size).save(directory/name)
    icon(round(size*2.25),True).save(directory/'ic_launcher_foreground.png')
for path in list(Path('android/app/src/main/res').glob('drawable*/splash.png'))+list(Path('ios/App/App/Assets.xcassets/Splash.imageset').glob('*.png')):
    with Image.open(path) as old: size=old.size
    image=Image.new('RGB',size,'#10150e'); mark=icon(min(size)//4);image.paste(mark,((size[0]-mark.width)//2,(size[1]-mark.height)//2),mark);image.save(path)
