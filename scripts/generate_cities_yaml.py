#!/usr/bin/env python3
"""
Generate a comprehensive cities.yaml covering 100+ countries.
Strategy: Major VPS countries get more cities, others get capital/major city.
"""
import json
from pathlib import Path

# Load countries data
root = Path(__file__).resolve().parents[1]
countries_file = root / "dict" / "generated" / "countries.json"
with countries_file.open() as f:
    countries = json.load(f)

# Define city data for 100+ countries
# Format: CC: [(city_key, name_en, name_zh, [aliases])]
CITIES_DATA = {
    # === Major VPS Countries (10-15 cities) ===
    "US": [
        ("LosAngeles", "Los Angeles", "洛杉矶", ["los angeles", "la", "洛杉矶", "lax"]),
        ("NewYork", "New York", "纽约", ["new york", "ny", "纽约", "nyc", "jfk"]),
        ("SanJose", "San Jose", "圣何塞", ["san jose", "sj", "圣何塞", "硅谷", "sjc"]),
        ("Seattle", "Seattle", "西雅图", ["seattle", "西雅图", "sea"]),
        ("Chicago", "Chicago", "芝加哥", ["chicago", "芝加哥", "ord"]),
        ("Dallas", "Dallas", "达拉斯", ["dallas", "达拉斯", "dfw"]),
        ("Miami", "Miami", "迈阿密", ["miami", "迈阿密", "mia"]),
        ("Atlanta", "Atlanta", "亚特兰大", ["atlanta", "亚特兰大", "atl"]),
        ("Phoenix", "Phoenix", "凤凰城", ["phoenix", "凤凰城", "phx"]),
        ("Denver", "Denver", "丹佛", ["denver", "丹佛", "den"]),
        ("Boston", "Boston", "波士顿", ["boston", "波士顿", "bos"]),
        ("Washington", "Washington DC", "华盛顿", ["washington", "dc", "华盛顿", "iad"]),
        ("SanFrancisco", "San Francisco", "旧金山", ["san francisco", "sf", "旧金山", "sfo"]),
        ("Portland", "Portland", "波特兰", ["portland", "波特兰", "pdx"]),
        ("LasVegas", "Las Vegas", "拉斯维加斯", ["las vegas", "拉斯维加斯", "las"]),
    ],
    "DE": [
        ("Frankfurt", "Frankfurt", "法兰克福", ["frankfurt", "法兰克福", "fra"]),
        ("Berlin", "Berlin", "柏林", ["berlin", "柏林", "ber"]),
        ("Munich", "Munich", "慕尼黑", ["munich", "慕尼黑", "muc"]),
        ("Hamburg", "Hamburg", "汉堡", ["hamburg", "汉堡", "ham"]),
        ("Cologne", "Cologne", "科隆", ["cologne", "科隆"]),
        ("Stuttgart", "Stuttgart", "斯图加特", ["stuttgart", "斯图加特"]),
        ("Dusseldorf", "Düsseldorf", "杜塞尔多夫", ["dusseldorf", "杜塞尔多夫"]),
        ("Dortmund", "Dortmund", "多特蒙德", ["dortmund", "多特蒙德"]),
        ("Nuremberg", "Nuremberg", "纽伦堡", ["nuremberg", "纽伦堡"]),
        ("Leipzig", "Leipzig", "莱比锡", ["leipzig", "莱比锡"]),
    ],
    "GB": [
        ("London", "London", "伦敦", ["london", "伦敦", "lon", "lhr"]),
        ("Manchester", "Manchester", "曼彻斯特", ["manchester", "曼彻斯特", "man"]),
        ("Birmingham", "Birmingham", "伯明翰", ["birmingham", "伯明翰"]),
        ("Edinburgh", "Edinburgh", "爱丁堡", ["edinburgh", "爱丁堡"]),
        ("Glasgow", "Glasgow", "格拉斯哥", ["glasgow", "格拉斯哥"]),
        ("Liverpool", "Liverpool", "利物浦", ["liverpool", "利物浦"]),
        ("Bristol", "Bristol", "布里斯托", ["bristol", "布里斯托"]),
        ("Leeds", "Leeds", "利兹", ["leeds", "利兹"]),
    ],
    
    # === Asia-Pacific (5-8 cities for major, 1-3 for others) ===
    "CN": [
        ("Beijing", "Beijing", "北京", ["beijing", "北京", "bjs", "pek"]),
        ("Shanghai", "Shanghai", "上海", ["shanghai", "上海", "sha", "pvg"]),
        ("Guangzhou", "Guangzhou", "广州", ["guangzhou", "广州", "can"]),
    ],
    "HK": [
        ("Central", "Central", "中环", ["central", "中环"]),
        ("Kowloon", "Kowloon", "九龙", ["kowloon", "九龙"]),
    ],
    "TW": [
        ("Taipei", "Taipei", "台北", ["taipei", "台北", "tpe"]),
        ("Hsinchu", "Hsinchu", "新竹", ["hsinchu", "新竹"]),
    ],
    "JP": [
        ("Tokyo", "Tokyo", "东京", ["tokyo", "东京", "tyo", "nrt"]),
        ("Osaka", "Osaka", "大阪", ["osaka", "大阪", "osa", "kix"]),
        ("Nagoya", "Nagoya", "名古屋", ["nagoya", "名古屋"]),
        ("Fukuoka", "Fukuoka", "福冈", ["fukuoka", "福冈"]),
    ],
    "KR": [("Seoul", "Seoul", "首尔", ["seoul", "首尔", "sel", "icn"])],
    "SG": [("Singapore", "Singapore", "新加坡", ["singapore", "新加坡", "sg", "sin"])],
    "MY": [("KualaLumpur", "Kuala Lumpur", "吉隆坡", ["kuala lumpur", "kl", "吉隆坡"])],
    "TH": [("Bangkok", "Bangkok", "曼谷", ["bangkok", "曼谷", "bkk"])],
    "VN": [("Hanoi", "Hanoi", "河内", ["hanoi", "河内"])],
    "PH": [("Manila", "Manila", "马尼拉", ["manila", "马尼拉"])],
    "ID": [("Jakarta", "Jakarta", "雅加达", ["jakarta", "雅加达"])],
    "IN": [
        ("Mumbai", "Mumbai", "孟买", ["mumbai", "孟买", "bom"]),
        ("Delhi", "Delhi", "德里", ["delhi", "德里"]),
    ],
    "PK": [("Karachi", "Karachi", "卡拉奇", ["karachi", "卡拉奇"])],
    "BD": [("Dhaka", "Dhaka", "达卡", ["dhaka", "达卡"])],
    "LK": [("Colombo", "Colombo", "科伦坡", ["colombo", "科伦坡"])],
    "NP": [("Kathmandu", "Kathmandu", "加德满都", ["kathmandu", "加德满都"])],
    "MM": [("Yangon", "Yangon", "仰光", ["yangon", "仰光"])],
    "KH": [("PhnomPenh", "Phnom Penh", "金边", ["phnom penh", "金边"])],
    "LA": [("Vientiane", "Vientiane", "万象", ["vientiane", "万象"])],
    "MN": [("Ulaanbaatar", "Ulaanbaatar", "乌兰巴托", ["ulaanbaatar", "乌兰巴托"])],
    
    # === Middle East ===
    "TR": [("Istanbul", "Istanbul", "伊斯坦布尔", ["istanbul", "伊斯坦布尔", "ist"])],
    "AE": [("Dubai", "Dubai", "迪拜", ["dubai", "迪拜", "dxb"])],
    "SA": [("Riyadh", "Riyadh", "利雅得", ["riyadh", "利雅得"])],
    "IL": [("TelAviv", "Tel Aviv", "特拉维夫", ["tel aviv", "特拉维夫"])],
    "QA": [("Doha", "Doha", "多哈", ["doha", "多哈"])],
    "KW": [("Kuwait", "Kuwait City", "科威特城", ["kuwait", "科威特"])],
    "BH": [("Manama", "Manama", "麦纳麦", ["manama", "麦纳麦"])],
    "OM": [("Muscat", "Muscat", "马斯喀特", ["muscat", "马斯喀特"])],
    "JO": [("Amman", "Amman", "安曼", ["amman", "安曼"])],
    "LB": [("Beirut", "Beirut", "贝鲁特", ["beirut", "贝鲁特"])],
    "IQ": [("Baghdad", "Baghdad", "巴格达", ["baghdad", "巴格达"])],
    "IR": [("Tehran", "Tehran", "德黑兰", ["tehran", "德黑兰"])],
    "SY": [("Damascus", "Damascus", "大马士革", ["damascus", "大马士革"])],
    "YE": [("Sanaa", "Sanaa", "萨那", ["sanaa", "萨那"])],
    "AM": [("Yerevan", "Yerevan", "埃里温", ["yerevan", "埃里温"])],
    "AZ": [("Baku", "Baku", "巴库", ["baku", "巴库"])],
    "GE": [("Tbilisi", "Tbilisi", "第比利斯", ["tbilisi", "第比利斯"])],
    
    # === Central Asia ===
    "KZ": [("Almaty", "Almaty", "阿拉木图", ["almaty", "阿拉木图"])],
    "UZ": [("Tashkent", "Tashkent", "塔什干", ["tashkent", "塔什干"])],
    "TM": [("Ashgabat", "Ashgabat", "阿什哈巴德", ["ashgabat", "阿什哈巴德"])],
    "KG": [("Bishkek", "Bishkek", "比什凯克", ["bishkek", "比什凯克"])],
    "TJ": [("Dushanbe", "Dushanbe", "杜尚别", ["dushanbe", "杜尚别"])],
    
    # === Americas ===
    "CA": [
        ("Toronto", "Toronto", "多伦多", ["toronto", "多伦多", "yyz"]),
        ("Vancouver", "Vancouver", "温哥华", ["vancouver", "温哥华", "yvr"]),
        ("Montreal", "Montreal", "蒙特利尔", ["montreal", "蒙特利尔"]),
    ],
    "MX": [("MexicoCity", "Mexico City", "墨西哥城", ["mexico city", "墨西哥城"])],
    "BR": [("SaoPaulo", "São Paulo", "圣保罗", ["sao paulo", "圣保罗", "gru"])],
    "AR": [("BuenosAires", "Buenos Aires", "布宜诺斯艾利斯", ["buenos aires", "布宜诺斯艾利斯"])],
    "CL": [("Santiago", "Santiago", "圣地亚哥", ["santiago", "圣地亚哥"])],
    "CO": [("Bogota", "Bogotá", "波哥大", ["bogota", "波哥大"])],
    "PE": [("Lima", "Lima", "利马", ["lima", "利马"])],
    "VE": [("Caracas", "Caracas", "加拉加斯", ["caracas", "加拉加斯"])],
    "EC": [("Quito", "Quito", "基多", ["quito", "基多"])],
    "UY": [("Montevideo", "Montevideo", "蒙得维的亚", ["montevideo", "蒙得维的亚"])],
    "PY": [("Asuncion", "Asunción", "亚松森", ["asuncion", "亚松森"])],
    "BO": [("LaPaz", "La Paz", "拉巴斯", ["la paz", "拉巴斯"])],
    "CR": [("SanJose", "San José", "圣何塞", ["san jose", "圣何塞"])],
    "PA": [("Panama", "Panama City", "巴拿马城", ["panama", "巴拿马"])],
    "GT": [("Guatemala", "Guatemala City", "危地马拉城", ["guatemala", "危地马拉"])],
    "CU": [("Havana", "Havana", "哈瓦那", ["havana", "哈瓦那"])],
    "DO": [("SantoDomingo", "Santo Domingo", "圣多明各", ["santo domingo", "圣多明各"])],
    "JM": [("Kingston", "Kingston", "金斯敦", ["kingston", "金斯敦"])],
    "TT": [("PortOfSpain", "Port of Spain", "西班牙港", ["port of spain", "西班牙港"])],
    
    # === Europe ===
    "FR": [
        ("Paris", "Paris", "巴黎", ["paris", "巴黎", "cdg"]),
        ("Marseille", "Marseille", "马赛", ["marseille", "马赛"]),
    ],
    "NL": [
        ("Amsterdam", "Amsterdam", "阿姆斯特丹", ["amsterdam", "阿姆斯特丹", "ams"]),
        ("Rotterdam", "Rotterdam", "鹿特丹", ["rotterdam", "鹿特丹"]),
    ],
    "BE": [("Brussels", "Brussels", "布鲁塞尔", ["brussels", "布鲁塞尔"])],
    "CH": [("Zurich", "Zurich", "苏黎世", ["zurich", "苏黎世"])],
    "AT": [("Vienna", "Vienna", "维也纳", ["vienna", "维也纳"])],
    "IE": [("Dublin", "Dublin", "都柏林", ["dublin", "都柏林"])],
    "IT": [
        ("Milan", "Milan", "米兰", ["milan", "米兰"]),
        ("Rome", "Rome", "罗马", ["rome", "罗马"]),
    ],
    "ES": [
        ("Madrid", "Madrid", "马德里", ["madrid", "马德里"]),
        ("Barcelona", "Barcelona", "巴塞罗那", ["barcelona", "巴塞罗那"]),
    ],
    "PT": [("Lisbon", "Lisbon", "里斯本", ["lisbon", "里斯本"])],
    "GR": [("Athens", "Athens", "雅典", ["athens", "雅典"])],
    "SE": [("Stockholm", "Stockholm", "斯德哥尔摩", ["stockholm", "斯德哥尔摩"])],
    "NO": [("Oslo", "Oslo", "奥斯陆", ["oslo", "奥斯陆"])],
    "DK": [("Copenhagen", "Copenhagen", "哥本哈根", ["copenhagen", "哥本哈根"])],
    "FI": [("Helsinki", "Helsinki", "赫尔辛基", ["helsinki", "赫尔辛基"])],
    "IS": [("Reykjavik", "Reykjavik", "雷克雅未克", ["reykjavik", "雷克雅未克"])],
    "PL": [("Warsaw", "Warsaw", "华沙", ["warsaw", "华沙"])],
    "CZ": [("Prague", "Prague", "布拉格", ["prague", "布拉格"])],
    "HU": [("Budapest", "Budapest", "布达佩斯", ["budapest", "布达佩斯"])],
    "RO": [("Bucharest", "Bucharest", "布加勒斯特", ["bucharest", "布加勒斯特"])],
    "BG": [("Sofia", "Sofia", "索非亚", ["sofia", "索非亚"])],
    "UA": [("Kyiv", "Kyiv", "基辅", ["kyiv", "kiev", "基辅"])],
    "RU": [
        ("Moscow", "Moscow", "莫斯科", ["moscow", "莫斯科", "mow"]),
        ("StPetersburg", "St. Petersburg", "圣彼得堡", ["st petersburg", "圣彼得堡"]),
    ],
    "BY": [("Minsk", "Minsk", "明斯克", ["minsk", "明斯克"])],
    "MD": [("Chisinau", "Chișinău", "基希讷乌", ["chisinau", "基希讷乌"])],
    "LT": [("Vilnius", "Vilnius", "维尔纽斯", ["vilnius", "维尔纽斯"])],
    "LV": [("Riga", "Riga", "里加", ["riga", "里加"])],
    "EE": [("Tallinn", "Tallinn", "塔林", ["tallinn", "塔林"])],
    "RS": [("Belgrade", "Belgrade", "贝尔格莱德", ["belgrade", "贝尔格莱德"])],
    "HR": [("Zagreb", "Zagreb", "萨格勒布", ["zagreb", "萨格勒布"])],
    "SI": [("Ljubljana", "Ljubljana", "卢布尔雅那", ["ljubljana", "卢布尔雅那"])],
    "SK": [("Bratislava", "Bratislava", "布拉迪斯拉发", ["bratislava", "布拉迪斯拉发"])],
    "MK": [("Skopje", "Skopje", "斯科普里", ["skopje", "斯科普里"])],
    "AL": [("Tirana", "Tirana", "地拉那", ["tirana", "地拉那"])],
    "BA": [("Sarajevo", "Sarajevo", "萨拉热窝", ["sarajevo", "萨拉热窝"])],
    "ME": [("Podgorica", "Podgorica", "波德戈里察", ["podgorica", "波德戈里察"])],
    "XK": [("Pristina", "Pristina", "普里什蒂纳", ["pristina", "普里什蒂纳"])],
    
    # === Africa ===
    "ZA": [("Johannesburg", "Johannesburg", "约翰内斯堡", ["johannesburg", "约翰内斯堡"])],
    "EG": [("Cairo", "Cairo", "开罗", ["cairo", "开罗"])],
    "NG": [("Lagos", "Lagos", "拉各斯", ["lagos", "拉各斯"])],
    "KE": [("Nairobi", "Nairobi", "内罗毕", ["nairobi", "内罗毕"])],
    "MA": [("Casablanca", "Casablanca", "卡萨布兰卡", ["casablanca", "卡萨布兰卡"])],
    "DZ": [("Algiers", "Algiers", "阿尔及尔", ["algiers", "阿尔及尔"])],
    "TN": [("Tunis", "Tunis", "突尼斯", ["tunis", "突尼斯"])],
    "ET": [("AddisAbaba", "Addis Ababa", "亚的斯亚贝巴", ["addis ababa", "亚的斯亚贝巴"])],
    "GH": [("Accra", "Accra", "阿克拉", ["accra", "阿克拉"])],
    "SN": [("Dakar", "Dakar", "达喀尔", ["dakar", "达喀尔"])],
    "CI": [("Abidjan", "Abidjan", "阿比让", ["abidjan", "阿比让"])],
    "CM": [("Yaounde", "Yaoundé", "雅温得", ["yaounde", "雅温得"])],
    "UG": [("Kampala", "Kampala", "坎帕拉", ["kampala", "坎帕拉"])],
    "TZ": [("DaresSalaam", "Dar es Salaam", "达累斯萨拉姆", ["dar es salaam", "达累斯萨拉姆"])],
    "ZW": [("Harare", "Harare", "哈拉雷", ["harare", "哈拉雷"])],
    "ZM": [("Lusaka", "Lusaka", "卢萨卡", ["lusaka", "卢萨卡"])],
    "MW": [("Lilongwe", "Lilongwe", "利隆圭", ["lilongwe", "利隆圭"])],
    "MZ": [("Maputo", "Maputo", "马普托", ["maputo", "马普托"])],
    "AO": [("Luanda", "Luanda", "罗安达", ["luanda", "罗安达"])],
    "NA": [("Windhoek", "Windhoek", "温得和克", ["windhoek", "温得和克"])],
    "BW": [("Gaborone", "Gaborone", "哈博罗内", ["gaborone", "哈博罗内"])],
    
    # === Oceania ===
    "AU": [
        ("Sydney", "Sydney", "悉尼", ["sydney", "悉尼", "syd"]),
        ("Melbourne", "Melbourne", "墨尔本", ["melbourne", "墨尔本"]),
    ],
    "NZ": [("Auckland", "Auckland", "奥克兰", ["auckland", "奥克兰"])],
    "PG": [("PortMoresby", "Port Moresby", "莫尔兹比港", ["port moresby", "莫尔兹比港"])],
    "FJ": [("Suva", "Suva", "苏瓦", ["suva", "苏瓦"])],
}

# Generate YAML
output = ["# 城市/地区定义", "# Cities definition for NNS v1 (proxy-focused)", ""]
output.append("# 覆盖 100+ 国家，主流VPS国家多城市，其他国家1-2个主要城市")
output.append("")
output.append("cities:")

for cc in sorted(CITIES_DATA.keys()):
    cities = CITIES_DATA[cc]
    output.append(f"  # === {cc} ({len(cities)} cities) ===")
    output.append(f"  {cc}:")
    for city_key, name_en, name_zh, aliases in cities:
        output.append(f"    {city_key}:")
        output.append(f"      name_en: \"{name_en}\"")
        output.append(f"      name_zh: \"{name_zh}\"")
        output.append(f"      aliases: {json.dumps(aliases, ensure_ascii=False)}")
    output.append("")

# Write to file
output_file = root / "dict" / "sources" / "cities.yaml"
output_file.write_text("\n".join(output), encoding="utf-8")

print(f"✓ Generated {output_file}")
print(f"  {len(CITIES_DATA)} countries, {sum(len(v) for v in CITIES_DATA.values())} cities")
