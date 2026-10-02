import json
import glob
import re

# Read all parts from data_part1.json to data_part8.json
all_parts = []
for i in range(1, 9):
    file_path = f"scripts/data_part{i}.json"
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        all_parts.extend(data)
        print(f"Loaded {file_path}: {len(data)} items")

print(f"Total raw retroactive records from user: {len(all_parts)}")

# Read current official dataset if present
current_official = []
try:
    with open("src/data/quebrasOfficialDataset.json", "r", encoding="utf-8") as f:
        current_official = json.load(f)
        print(f"Loaded current official dataset: {len(current_official)} items")
except Exception as e:
    print(f"Could not load current official dataset: {e}")

# Helper to normalize deduplication key matching typescript retro parser
def get_dedup_key(item):
    # data, codProduto, colaborador, area, turno, quantidade, codQuebra, motivo
    data_str = str(item.get("Data") or item.get("data") or "")
    cod_prod = str(item.get("CodProduto") or item.get("codProduto") or "")
    colab = str(item.get("Colaborador") or item.get("colaborador") or "").strip().upper()
    area = str(item.get("Area") or item.get("area") or "").strip().upper()
    turno = str(item.get("Turno") or item.get("turno") or "").strip().upper()
    qtd = str(item.get("Quantidade") or item.get("quantidade") or 0)
    cod_q = str(item.get("CodQuebra") or item.get("codQuebra") or "").strip().upper()
    motivo = str(item.get("Motivo") or item.get("motivo") or "").strip().upper()
    return f"{data_str}|{cod_prod}|{colab}|{area}|{turno}|{qtd}|{cod_q}|{motivo}"

# Deduplicate all_parts
seen_keys = set()
deduped_user_parts = []
user_duplicates = 0

for item in all_parts:
    key = get_dedup_key(item)
    if key not in seen_keys:
        seen_keys.add(key)
        deduped_user_parts.append(item)
    else:
        user_duplicates += 1

print(f"Deduplicated user parts: {len(deduped_user_parts)} (removed {user_duplicates} duplicates)")

# Analyze dates in user dataset
user_dates = [x.get("Data", "") for x in deduped_user_parts if x.get("Data")]
if user_dates:
    min_date = min(user_dates)
    max_date = max(user_dates)
    print(f"Retroactive User Dataset date range: {min_date} to {max_date}")

# Let's inspect current_official dates and records
official_dates = [x.get("Data", "") for x in current_official if x.get("Data")]
if official_dates:
    print(f"Current Official Dataset date range: {min_date if official_dates else 'N/A'} to {max(official_dates)}")

# Check if there are records in current_official that have dates AFTER the max date in user dataset or after 2026-08-10
# Also check if any other records in current_official exist that are not in the user retroactive set
added_from_official = 0
for item in current_official:
    d = str(item.get("Data") or "")
    # Check if this item is after max date or not covered
    key = get_dedup_key(item)
    if key not in seen_keys:
        # If date is strictly after max_date of retroactive base or after August 10
        # Let's inspect
        seen_keys.add(key)
        deduped_user_parts.append(item)
        added_from_official += 1

print(f"Total merged records: {len(deduped_user_parts)} (Added {added_from_official} unique records from previous official)")

# Calculate total valor and total hecto
total_valor = 0.0
total_hecto = 0.0
total_qtd = 0

for r in deduped_user_parts:
    v = r.get("VALOR DA AVARIA") or r.get("valorAvaria") or 0.0
    h = r.get("HECTO PERDIDO ") or r.get("HECTO PERDIDO") or r.get("hectoPerdido") or 0.0
    q = r.get("Quantidade") or r.get("quantidade") or 0
    try:
        total_valor += float(v)
    except:
        pass
    try:
        total_hecto += float(h)
    except:
        pass
    try:
        total_qtd += int(q)
    except:
        pass

print(f"=== SUMMARY METRICS ===")
print(f"Total Records: {len(deduped_user_parts)}")
print(f"Total Valor Avaria: R$ {total_valor:,.2f}")
print(f"Total Hecto Perdido: {total_hecto:,.3f} HL")
print(f"Total Quantidade Itens: {total_qtd:,}")

# Write to src/data/quebrasOfficialDataset.json
with open("src/data/quebrasOfficialDataset.json", "w", encoding="utf-8") as f:
    json.dump(deduped_user_parts, f, ensure_ascii=False, indent=2)

print("Saved cleanly to src/data/quebrasOfficialDataset.json!")
