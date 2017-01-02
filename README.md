kodi-query-cli
==============
Command line interface to query listings from a Kodi server.

Features:

* Can be used to output data in a variety of formats
* Can compare an existing directory of files against a remote Kodi server for info (`--filter-by basename <path>`)


```
  Usage: kodi-query [paths...]

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -h, --host [address]     Sepecify the Kodi host
    -p, --port [number]      Specify the Kodi host port (default: 9090)
    -o, --output [renderer]  Set the output renderer. Values: json
    -v, --verbose            Be verbose
    --filter-by [field]      Filter output by a specified field (e.g. "basename" to filter only matching file basenames)
    --type [csv]             What types to query as a CSV (default: "movies,tv")
    --fields [csv]           Fields to request as a CSV (default: "title,year,file,thumbnail,plot,cast,rating")
    --sort [csv]             Fields to sort the output by as a CSV (default: "title,year")
    --start [number]         Start at a given offset
    --end [number]           End at a given offset
```


Examples
========
Get all titles of all movies known by Kodi:

	kodi-query --host kodiserver -o titles


Compare a directory of files on this machine against a remote Kodi server and compose a HTML page brochure of the contents

	kodi-query --host kodiserver -o brochure --filter-by basename ~/Desktop/Videos/*
