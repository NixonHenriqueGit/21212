import json
import os

target_file = "src/data/quebrasOfficialDataset.json"

def clean_record(r):
    data = str(r.get("Data") or r.get("data") or "").strip()
    mes = str(r.get("Mês") or r.get("mes") or "").strip().upper()
    try:
        cod_prod = int(float(str(r.get("CodProduto") or r.get("codProduto") or 0).strip()))
    except:
        cod_prod = 0
    desc = str(r.get("Descricao") or r.get("descricao") or "").strip().upper()
    try:
        qtd = float(r.get("Quantidade") or r.get("quantidade") or 1)
        if qtd.is_integer():
            qtd = int(qtd)
    except:
        qtd = 1
    area = str(r.get("Area") or r.get("area") or "ARMAZEM").strip().upper()
    turno = str(r.get("Turno") or r.get("turno") or "MANHÃ").strip().upper()
    if "MANH" in turno:
        turno = "MANHÃ"
    elif "NOIT" in turno or "MADRUG" in turno:
        turno = "NOITE"
    else:
        turno = "MANHÃ"
    cod_quebra = str(r.get("CodQuebra") or r.get("codQuebra") or "539").strip()
    motivo = str(r.get("Motivo") or r.get("motivo") or "QUEBRA OPERACIONAL").strip().upper()
    colab = str(r.get("Colaborador") or r.get("colaborador") or "").strip().upper()
    funcao = str(r.get("Funcao") or r.get("funcao") or "").strip().upper()
    try:
        val = float(r.get("VALOR DA AVARIA") or r.get("valorDaAvaria") or r.get("valor") or 0)
    except:
        val = 0.0
    try:
        hl = float(r.get("HECTO LITRO") or r.get("hectoLitro") or 0.0035)
    except:
        hl = 0.0035
    try:
        hl_perdido = float(r.get("HECTO PERDIDO ") or r.get("HECTO PERDIDO") or r.get("hectoPerdido") or (hl * qtd))
    except:
        hl_perdido = hl * qtd

    # month derivation
    if not mes and data:
        if "-" in data:
            parts = data.split("-")
            m_idx = int(parts[1]) - 1
            month_names = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"]
            if 0 <= m_idx < len(month_names):
                mes = month_names[m_idx]

    return {
        "Data": data,
        "Mês": mes or "JANEIRO",
        "CodProduto": cod_prod,
        "Descricao": desc,
        "Quantidade": qtd,
        "Area": area,
        "Turno": turno,
        "CodQuebra": cod_quebra,
        "Motivo": motivo,
        "Colaborador": colab,
        "Funcao": funcao,
        "VALOR DA AVARIA": val,
        "HECTO LITRO": hl,
        "HECTO PERDIDO ": round(hl_perdido, 5)
    }

print("Base helper ready")
