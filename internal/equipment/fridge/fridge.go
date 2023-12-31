package fridge

import (
	"goconso/internal/equipment"
)

//------------------------------------------------------------------------------
// Structure
//------------------------------------------------------------------------------

// A fridge is an equipement that freshly stores foods.
type fridge struct {
	name           string
	power          int
	operatingHours string
}

//------------------------------------------------------------------------------
// Factory
//------------------------------------------------------------------------------

// NewFridge returns a new Equipment.
func New() equipment.Equipment {
	return NewWithOperatingHours("always")
}

// NewWithOperatingHours returns a new Equipment with given operating hours.
func NewWithOperatingHours(operatingHours string) equipment.Equipment {
	return &fridge{
		name:           "Frigo",
		power:          200,
		operatingHours: operatingHours,
	}
}

//------------------------------------------------------------------------------
// Functions
//------------------------------------------------------------------------------

// Name
func (c *fridge) Name() string {
	return c.name
}

// OperatingHours returns the operating hours.
func (c *fridge) OperatingHours() string {
	return c.operatingHours
}
