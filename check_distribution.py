import json

with open("js/database.js", "r", encoding="utf-8") as f:
    content = f.read()

# Extract CardDatabase
start_db = content.find("const CardDatabase = ") + len("const CardDatabase = ")
end_db = content.find("const PackLicenses = ")
db_text = content[start_db:end_db].strip()
if db_text.endswith(";"):
    db_text = db_text[:-1]
db = json.loads(db_text)

# Extract PackLicenses
start_pack = content.find("const PackLicenses = ") + len("const PackLicenses = ")
end_pack = content.find("const ShopCharms = ")
pack_text = content[start_pack:end_pack].strip()
if pack_text.endswith(";"):
    pack_text = pack_text[:-1]
packs = json.loads(pack_text)

print(f"Total Database size: {len(db)} vehicles.")
print("Distribution per Pack License:")
for pack in packs:
    name = pack["name"]
    eligible = [car for car in db if name in car["pack_eligibility"]]
    print(f"  * {name}: {len(eligible)} cards")
