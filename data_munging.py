import csv

# stations = {}
# reader = csv.reader(open("station.csv","rb"))
# reader.next()
# for row in reader:
# 	stations[row[0]]={'lat':row[2],'long':row[3]}

# reader = csv.reader(open("trip.csv","rb"))
# writer = csv.writer(open("trip_out.csv","w"))
# row0 = reader.next()
# row0.append("from_station_lat")
# row0.append("from_station_long")
# row0.append("to_station_lat")
# row0.append("to_station_long")
# writer.writerow(row0)

# for row in reader:
# 	try:
# 		row.append(stations[row[7]]['lat'])
# 		row.append(stations[row[7]]['long'])
# 		row.append(stations[row[8]]['lat'])
# 		row.append(stations[row[8]]['long'])
# 		writer.writerow(row)
# 	except:
# 		print "skipping row"


f = open("trip_out.csv","r");
reader = csv.DictReader(f)

import collections
import datetime

def default_factory():
	return []
date_dict = collections.defaultdict(default_factory)
for row in reader:
	parsed_date = datetime.datetime.strptime(row['starttime'],"%m/%d/%Y %H:%M")
	date_dict[parsed_date.date()].append(row)

k = [k for k in date_dict.keys() if len(date_dict.get(k))==max([len(n) for n in date_dict.values()])]
# print date_dict[k[0]]
k = date_dict[k[0]]
w = csv.DictWriter(open("trip_date_max.csv","w"),k[0].keys(),quoting=csv.QUOTE_ALL)
w.writeheader()
w.writerows(k)
