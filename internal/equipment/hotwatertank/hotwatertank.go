package hotwatertank

import (
	"goconso/internal/equipment"
)

//------------------------------------------------------------------------------
// Structure
//------------------------------------------------------------------------------

// A hotwatertank is an equipement that boils water for shower.
type hotwatertank struct {
	name           string
	power          int
	operatingHours string
}

//------------------------------------------------------------------------------
// Factory
//------------------------------------------------------------------------------

// New returns a new Equipment.
func New() equipment.Equipment {
	return NewWithOperatingHours("always")
}

// NewWithOperatingHours returns a new Equipment with given operating hours.
func NewWithOperatingHours(operatingHours string) equipment.Equipment {
	return &hotwatertank{
		name:           "Ballon d'eau chaude",
		power:          200,
		operatingHours: operatingHours,
	}
}

//------------------------------------------------------------------------------
// Functions
//------------------------------------------------------------------------------

// Name
func (c *hotwatertank) Name() string {
	return c.name
}

// OperatingHours returns the operating hours.
func (c *hotwatertank) OperatingHours() string {
	return c.operatingHours
}
