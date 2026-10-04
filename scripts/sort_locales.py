import json
import glob
import os
import sys

def sort_locale_files(locales_dir):
    pattern = os.path.join(locales_dir, "*.json")
    json_files = glob.glob(pattern)

    if not json_files:
        print(f"Error: No JSON files found in {locales_dir}")
        sys.exit(1)

    print(f"Found {len(json_files)} JSON file(s) in: {locales_dir}\n")

    has_error = False

    for file_path in json_files:
        file_name = os.path.basename(file_path)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                original_data = json.load(f)

            if not isinstance(original_data, dict):
                print(f"[-] {file_name}: Skipping (not a JSON object)")
                continue

            original_count = len(original_data)

            # Sort by lowercase key first, then raw key
            sorted_items = sorted(
                original_data.items(),
                key=lambda item: (item[0].lower(), item[0])
            )
            sorted_data = dict(sorted_items)

            # Integrity check
            if len(sorted_data) != original_count:
                print(f"[!] {file_name}: Key count mismatch ({original_count} vs {len(sorted_data)})!")
                has_error = True
                continue

            # Write back sorted JSON
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(sorted_data, f, ensure_ascii=False, indent=2)
                f.write("\n")

            # Verification by re-reading
            with open(file_path, "r", encoding="utf-8") as f:
                verified_data = json.load(f)

            if set(verified_data.keys()) != set(original_data.keys()):
                print(f"[!] {file_name}: Key set mismatch after write!")
                has_error = True
                continue

            print(f"[OK] {file_name}: Successfully sorted {original_count} keys (A to Z)")

        except Exception as e:
            print(f"[ERROR] {file_name}: {e}")
            has_error = True

    if has_error:
        print("\nFinished with errors.")
        sys.exit(1)
    else:
        print("\nAll locale JSON files sorted and verified successfully!")

if __name__ == "__main__":
    # Locate patches/locales/zh-CN relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    default_dir = os.path.join(project_root, "patches", "locales", "zh-CN")

    target_dir = sys.argv[1] if len(sys.argv) > 1 else default_dir
    sort_locale_files(target_dir)
