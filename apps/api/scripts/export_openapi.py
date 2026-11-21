import json
import sys
from pathlib import Path

API_DIR = Path(__file__).resolve().parent.parent
SRC_DIR = API_DIR / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from main import app


def main() -> None:
    output_path = API_DIR / "openapi.json"
    schema = app.openapi()
    _ = output_path.write_text(
        json.dumps(schema, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"OpenAPI schema exported to {output_path}")


if __name__ == "__main__":
    main()
