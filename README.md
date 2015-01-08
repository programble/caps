# Caps

Store any file on anonymous public services.

Caps uploads files in chunks to anonymous public storage services, such
as pastebins, image sharing services, and URL shorteners. Information
needed to retrieve the chunks is saved, and can be used with Caps again
to reconstruct the original file.

## Install

```
npm install -g caps
```

## Usage

```
usage: caps upload|download|convert [options...] [file]

upload options:
  -b, --chunk-size=262144  maximum chunk size in bytes
  -v, --vary               vary chunk size
  -r, --redundancy=1       chunk upload redundancy
  -s, --stores=...         comma-separated list of stores to use
  -x, --exclude=...        comma-separated list of stores to exclude

convert options:
  -i, --input=base64       format of input (see -f)

common options:
  -o, --output=-           output to file
  -f, --format=base64      format of data: json, msgpack, base64, png

general options:
  -q, --quiet              suppress logging
  -h, --help               show help
```

### Output

The default format of Caps retrieval data is a base64 representation of
a msgpacked JSON array, for easy and compact copy-paste. Other formats
are available, and can be selected using the `-f` option:

 - `json`: JSON array
 - `msgpack`: msgpacked JSON array (binary)
 - `base64`: base64 msgpacked JSON array
 - `png`: PNG-pixel-data-encoded msgpacked JSON array (binary)

The `-o` option can be used to dump Caps data (or a retrieved file) to a
file. By default data is written to standard output.

### Upload

Caps splits files into chunks of 256 KiB by default. The (maximum) chunk
size can be set with the `-b` option, in bytes. By default each chunk
will be the same size (except the last chunk). The `-v` option causes
chunk size to vary based on the maximum chunk size of each store. Each
chunk can be uploaded to multiple stores with the `-r` option. This will
provide redundancy in case retrieving a chunk from one store fails.

By default, Caps uploads to any stores capable of storing the specified
chunk size if `-v` is not used. The `-s` option can be used to set the
list of stores to use. Alternatively, stores can be blacklisted with the
`-x` option.

The information needed to retrieve the original file is then written to
standard output, or a file with the `-o` option, in the format specified
by the `-f` option.

```
caps upload -r 2 -f png -o YellowSubmarine.png YellowSubmarine.mp3
```

### Download

Caps reads retrieval data from a file or from standard input. If the
data format is not the default (base64), it must be specified with the
`-f` option. The file is then downloaded in chunks using the stored
information and reconstructed. The reconstructed file is checked against
the stored SHA checksum, then is written to standard output, or a file
using the `-o` option.

```
caps download -f png YellowSubmarine.png -o YellowSubmarine.mp3
```

### Convert

Caps can convert retrieval data between formats. The input format should
be specified with the `-i` option, and the output format with the `-f`
option.

```
caps convert -i png YellowSubmarine.png -f json -o YellowSubmarine.json
```

## Stores

Caps is capable of uploading chunks as base64 text (to pastebins or URL
shorteners) or as PNG pixel data (to image sharing services). Most
services enforce a hard limit on the size of data that can be uploaded,
which must be considered when choosing chunk sizes.

| Index | Name            | Encoding | Max Chunk Size (bytes) | Notes
| ----- | --------------- | -------- | ---------------------- | -----
| 0     | [gist][0]       | base64   | unknown                |
| 1     | [imgur][1]      | PNG      | 999602                 | Lossless PNGs up to 1 MB
| 3     | [sprunge][3]    | base64   | none                   |
| 4     | [is.gd][4]      | URL      | 3735                   |
| 5     | [v.gd][5]       | URL      | 3735                   | is.gd on a different domain
| 6     | [pastebin][6]   | base64   | 384000                 | Nasty rate limits :disappointed:
| 7     | [da.gd][7]      | URL      | 30570                  |
| 8     | [mediacrush][8] | PNG      | 49999602               |

 [0]: https://gist.github.com
 [1]: http://imgur.com
 [3]: http://sprunge.us
 [4]: http://is.gd
 [5]: http://v.gd
 [6]: http://pastebin.com
 [7]: http://da.gd
 [8]: https://mediacru.sh

Know of any other anonymous public storage services? Open an
[issue](https://github.com/programble/caps/issues) or [pull
request](https://github.com/programble/caps/pulls).

## Warnings

File chunks uploaded by Caps are publicly accessible and unencrypted. If
you are concerned about privacy, encrypt your files before using Caps.

Storage services may not retain data indefinitely. Do not expect Caps
downloads to work forever. For increased chances of successful
downloads, use redundancy.

## Unlicense

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <http://unlicense.org/>
