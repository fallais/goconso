# GoConso

**GoConso** will help you to **understand** your electrical consomation and **optimize** it.

## Configuration file

Create a file `ma_conso.yml`, like this:

```yml
# Option (base ou hc_hp)
option: "hc_hp"

# Index
index:
  hc: 1600
  hp: 1200
```

## Usage

Then run `go run main.go`.