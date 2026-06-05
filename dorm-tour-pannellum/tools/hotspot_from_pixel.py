#!/usr/bin/env python3
"""
Convert clicked pixel coordinates into approximate Pannellum pitch/yaw.

Formula assumes your scene uses partial equirectangular mapping centered at yaw=0,
matching the current base scene pattern in this project.
"""

import argparse


def convert(x, y, width, height, haov, vaov, voffset):
    yaw = ((x / width) - 0.5) * haov
    pitch = (0.5 - (y / height)) * vaov + voffset
    return pitch, yaw


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--x", type=float, required=True, help="Pixel X from left")
    parser.add_argument("--y", type=float, required=True, help="Pixel Y from top")
    parser.add_argument("--width", type=float, required=True, help="Image width in pixels")
    parser.add_argument("--height", type=float, required=True, help="Image height in pixels")
    parser.add_argument("--haov", type=float, default=110.0, help="Scene haov")
    parser.add_argument("--vaov", type=float, default=45.0, help="Scene vaov")
    parser.add_argument("--voffset", type=float, default=0.0, help="Scene vOffset")
    parser.add_argument("--scene-id", default="targetSceneId", help="Snippet sceneId")
    parser.add_argument("--text", default="Go to next scene", help="Snippet text")
    args = parser.parse_args()

    pitch, yaw = convert(
        args.x, args.y, args.width, args.height, args.haov, args.vaov, args.voffset
    )

    pitch = round(pitch, 2)
    yaw = round(yaw, 2)

    print(f"pitch={pitch}")
    print(f"yaw={yaw}")
    print()
    print("{")
    print(f"  pitch: {pitch},")
    print(f"  yaw: {yaw},")
    print('  type: "scene",')
    print(f'  text: "{args.text}",')
    print(f'  sceneId: "{args.scene_id}"')
    print("}")


if __name__ == "__main__":
    main()
