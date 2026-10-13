import sqlite3
import sys
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "hrms.db"

def format_grid(headers, rows):
    if not headers:
        return "No results."
    widths = [len(str(h)) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            widths[i] = max(widths[i], len(str(val) if val is not None else "NULL"))
    
    border = "+" + "+".join("-" * (w + 2) for w in widths) + "+"
    header_line = "| " + " | ".join(f"{str(headers[i]):<{widths[i]}}" for i in range(len(headers))) + " |"
    
    lines = [border, header_line, border]
    for row in rows:
        row_line = "| " + " | ".join(f"{str(val if val is not None else 'NULL'):<{widths[i]}}" for i, val in enumerate(row)) + " |"
        lines.append(row_line)
    lines.append(border)
    return "\n".join(lines)

def run_query(sql):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute(sql)
        if sql.strip().upper().startswith("SELECT"):
            headers = [d[0] for d in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            print(format_grid(headers, rows))
            print(f"({len(rows)} row(s) returned)\n")
        else:
            conn.commit()
            print(f"Query OK, {cursor.rowcount} row(s) affected.\n")
    except Exception as e:
        print(f"SQL Error: {e}\n")
    finally:
        conn.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(f"Executing: {query}\n")
        run_query(query)
    else:
        print("=" * 60)
        print("  HRMS Interactive SQL Shell")
        print("  Type any SQL query (e.g. SELECT * FROM employees;) or 'exit'")
        print("=" * 60 + "\n")
        conn = sqlite3.connect(DB_PATH)
        while True:
            try:
                user_input = input("SQL> ").strip()
                if not user_input:
                    continue
                if user_input.lower() in ["exit", "quit", "q"]:
                    break
                run_query(user_input)
            except (KeyboardInterrupt, EOFError):
                break
        print("\nBye!")
