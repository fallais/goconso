# GoConso

**GoConso** will help you to **understand** your electrical consomation and **optimize** it.

## Configuration file

Create a file `ma_conso.yml`, like this:

```yml
# Option (base ou heures_creuses)
option: "heures_creuses"

# Index
index:
  heures_creuses: 1600
  heures_pleines: 1200
```

## Usage

Then run `go run main.go`.