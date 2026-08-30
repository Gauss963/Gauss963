#!/usr/bin/env python3
"""
標準工作流:單張照片 -> H264影片 -> 抽幀 -> 多幀平均降噪 -> 差異比較

流程:
  1. original.*          (使用者提供的原始照片)
  2. video.mov            H264 編碼, 1fps, 60秒, 與原圖同解析度
  3. frame.png            擷取第 10 幀
  4. stacked.png          全部幀取平均 (降噪)
  5. diff_fo.png          original vs frame.png
  6. diff_so.png          original vs stacked.png
  7. diff_fs.png          frame.png vs stacked.png

比較圖一律使用: blend=all_mode=difference,format=gray,histeq

使用方式:
  python3 photo_denoise_workflow.py original.png
  (若不指定參數, 預設抓同資料夾底下的 original.png / original.jpg / original.jpeg)
"""

import subprocess
import sys
import shutil
from pathlib import Path

# ----------------------------
# 參數設定
# ----------------------------
DURATION_SEC = 600      # 影片長度(秒)
FPS = 1                 # 幀率
TARGET_FRAME_INDEX = 10  # 要抽取的幀數(第幾幀, 從 1 開始算)

WORKDIR = Path(__file__).resolve().parent

VIDEO = WORKDIR / "video.mov"
FRAME = WORKDIR / "frame.png"
STACKED = WORKDIR / "stacked.png"
DIFF_FO = WORKDIR / "diff_fo.png"   # original vs frame
DIFF_SO = WORKDIR / "diff_so.png"   # original vs stacked
DIFF_FS = WORKDIR / "diff_fs.png"   # frame vs stacked


def run(cmd, desc):
    """執行 ffmpeg/ffprobe 指令, 失敗就直接中止並印出錯誤。"""
    print(f"\n=== {desc} ===")
    print(" ".join(str(c) for c in cmd))
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(result.stderr[-3000:])  # 只印最後一段, 避免洗版
        raise RuntimeError(f"指令失敗: {desc}")
    return result


def find_original():
    """在腳本所在資料夾找 original.png / .jpg / .jpeg"""
    for ext in ("png", "jpg", "jpeg", "PNG", "JPG", "JPEG"):
        p = WORKDIR / f"original.{ext}"
        if p.exists():
            return p
    return None


def check_ffmpeg():
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        print("找不到 ffmpeg / ffprobe, 請先安裝 (brew install ffmpeg)")
        sys.exit(1)


def get_total_frames(video_path: Path) -> int:
    """精確計算影片實際幀數(比 duration*fps 更可靠)。"""
    result = run(
        [
            "ffprobe", "-v", "error", "-count_frames",
            "-select_streams", "v:0",
            "-show_entries", "stream=nb_read_frames",
            "-of", "csv=p=0",
            str(video_path),
        ],
        "計算影片實際總幀數",
    )
    # 某些 ffprobe 版本的 csv=p=0 輸出會多帶一個逗號 (例如 "60,"),
    # 這裡取第一個非空欄位再轉整數, 較為穩健。
    raw = result.stdout.strip()
    first_field = raw.split(",")[0].strip()
    return int(first_field)


def step2_make_video(original: Path):
    """單張照片 -> H264, 1fps, 60秒, 同解析度的影片"""
    if VIDEO.exists():
        print(f"[跳過] {VIDEO.name} 已存在")
        return
    run(
        [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", str(original),
            "-t", str(DURATION_SEC),
            "-r", str(FPS),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            str(VIDEO),
        ],
        f"產生 {DURATION_SEC} 秒 / {FPS}fps 的 H264 影片",
    )


def step3_extract_frame():
    """抽取第 TARGET_FRAME_INDEX 幀 -> frame.png"""
    if FRAME.exists():
        print(f"[跳過] {FRAME.name} 已存在")
        return
    n = TARGET_FRAME_INDEX - 1  # select 用 0-indexed
    run(
        [
            "ffmpeg", "-y",
            "-i", str(VIDEO),
            "-vf", f"select=eq(n\\,{n})",
            "-vframes", "1",
            str(FRAME),
        ],
        f"抽取第 {TARGET_FRAME_INDEX} 幀",
    )


def step4_average_frames():
    """全部幀取平均 -> stacked.png (用拆幀+numpy, 不受 tmix 幀數上限限制)"""
    if STACKED.exists():
        print(f"[跳過] {STACKED.name} 已存在")
        return

    import numpy as np
    from PIL import Image
    import tempfile

    total_frames = get_total_frames(VIDEO)
    print(f"影片總幀數: {total_frames}")

    with tempfile.TemporaryDirectory(dir=WORKDIR) as tmpdir:
        pattern = str(Path(tmpdir) / "f_%05d.png")
        run(
            ["ffmpeg", "-y", "-i", str(VIDEO), pattern],
            "拆解全部幀 (供平均使用)",
        )

        frame_files = sorted(Path(tmpdir).glob("f_*.png"))
        if not frame_files:
            raise RuntimeError("沒有成功拆出任何幀")

        print(f"實際拆出 {len(frame_files)} 張, 開始平均...")
        acc = None
        for f in frame_files:
            arr = np.asarray(Image.open(f), dtype=np.float64)
            acc = arr if acc is None else acc + arr
        avg = (acc / len(frame_files)).astype(np.uint8)
        Image.fromarray(avg).save(STACKED)
        print(f"已輸出 {STACKED.name}")


def diff_histeq(img_a: Path, img_b: Path, out: Path, desc: str):
    """差異圖: difference -> gray -> histeq (不 negate, 差越多越亮)"""
    if out.exists():
        print(f"[跳過] {out.name} 已存在")
        return
    run(
        [
            "ffmpeg", "-y",
            "-i", str(img_a),
            "-i", str(img_b),
            "-filter_complex", "blend=all_mode=difference,format=gray,histeq",
            str(out),
        ],
        desc,
    )


def main():
    check_ffmpeg()

    if len(sys.argv) > 1:
        original = Path(sys.argv[1]).resolve()
    else:
        original = find_original()

    if original is None or not original.exists():
        print("找不到原始照片。請把照片命名為 original.png/.jpg 放在同資料夾,")
        print("或執行: python3 photo_denoise_workflow.py 你的照片檔名")
        sys.exit(1)

    print(f"原始照片: {original}")

    # Step 2: 照片 -> 影片
    step2_make_video(original)

    # Step 3: 抽第 10 幀
    step3_extract_frame()

    # Step 4: 全幀平均
    step4_average_frames()

    # Step 5-7: 三組差異比較
    diff_histeq(original, FRAME, DIFF_FO, "比較 original vs frame.png -> diff_fo.png")
    diff_histeq(original, STACKED, DIFF_SO, "比較 original vs stacked.png -> diff_so.png")
    diff_histeq(FRAME, STACKED, DIFF_FS, "比較 frame.png vs stacked.png -> diff_fs.png")

    print("\n全部完成! 產出檔案:")
    for f in [VIDEO, FRAME, STACKED, DIFF_FO, DIFF_SO, DIFF_FS]:
        print(f"  - {f.name}")


if __name__ == "__main__":
    main()