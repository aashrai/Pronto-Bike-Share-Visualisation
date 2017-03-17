import csv

stations = {}
reader = csv.reader(open("station.csv","rb"))
reader.next()
for row in reader:
	stations[row[0]]={'lat':row[2],'long':row[3]}

reader = csv.reader(open("trip.csv","rb"))
writer = csv.writer(open("trip_out.csv","w"))
row0 = reader.next()
row0.append("from_station_lat")
row0.append("from_station_long")
row0.append("to_station_lat")
row0.append("to_station_long")
writer.writerow(row0)

for row in reader:
	try:
		row.append(stations[row[7]]['lat'])
		row.append(stations[row[7]]['long'])
		row.append(stations[row[8]]['lat'])
		row.append(stations[row[8]]['long'])
		writer.writerow(row)
	except:
		print "skipping row"


f = open("trip_out.csv","r");
reader = csv.DictReader(f)

import collections
import datetime

def default_factory():
	return []
date_dict = collections.defaultdict(default_factory)
date_dict_weekend = collections.defaultdict(default_factory)
for row in reader:
	parsed_date = datetime.datetime.strptime(row['starttime'],"%m/%d/%Y %H:%M")
	if parsed_date.isoweekday() in range(1,6):
		date_dict[parsed_date.date()].append(row)
	else:
		date_dict_weekend[parsed_date.date()].append(row)

def getMaxKeyValue(dict):
	return [k for k in dict.keys() if len(dict.get(k))==max([len(n) for n in dict.values()])][0]
k_weekday = getMaxKeyValue(date_dict)
k_weekend = getMaxKeyValue(date_dict_weekend)
print k_weekday
# print date_dict[k[0]]

def createCsv(key, name, dict):
	k = dict[key]
	w = csv.DictWriter(open(name,"w"),k[0].keys(),quoting=csv.QUOTE_ALL)
	w.writeheader()
	w.writerows(k)

createCsv(k_weekday,"trip_date_max.csv",date_dict);
createCsv(k_weekend,"trip_date_max_weekend.csv",date_dict_weekend)
