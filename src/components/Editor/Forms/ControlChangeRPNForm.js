import React from "react";
import {
    Checkbox,
    FormControlLabel,
    Stack,
    TextField
} from "@mui/material";

function ControlChangeRPNForm({
    currentKnob,
    handleMSBChange,
    handleLSBChange,
    handleInvertValueAChange,
    handleMinAChange,
    handleMaxAChange
}) {
    const {
        msb,
        lsb,
        invert_a,
        min_a,
        max_a
    } = currentKnob;

    return (
        <Stack
            direction="column"
            spacing={2}
        >
            <Stack
                direction="row"
                spacing={2}
            >
                <TextField
                    fullWidth
                    size="small"
                    label="MSB"
                    type="number"

                    InputProps={{ inputProps: { min: 0, max: 127 } }}
                    value={msb}
                    onChange={handleMSBChange}
                />

                <TextField
                    fullWidth
                    size="small"
                    label="LSB"
                    type="number"

                    InputProps={{ inputProps: { min: 0, max: 127 } }}
                    value={lsb}
                    onChange={handleLSBChange}
                />
            </Stack>

            <Stack
                direction="row"
                spacing={2}
            >
                <TextField
                    fullWidth
                    size="small"
                    label="Min"
                    type="number"
                    InputProps={{ inputProps: { min: 0, max: max_a } }}
                    value={min_a}
                    onChange={handleMinAChange}
                />
                <TextField
                    fullWidth
                    size="small"
                    label="Max"
                    type="number"
                    InputProps={{ inputProps: { min: min_a, max: 127 } }}
                    value={max_a}
                    onChange={handleMaxAChange}
                />

                <FormControlLabel
                    control={
                        <Checkbox
                            checked={invert_a}
                            onChange={handleInvertValueAChange}
                        />
                    }
                    label="Invert" />
            </Stack>
        </Stack >
    )
}

export default ControlChangeRPNForm;