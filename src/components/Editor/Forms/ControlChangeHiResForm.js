import React from "react";
import ChannelSelect from "../Components/ChannelSelect";

function ControlChangeHiResForm({
    currentKnob,
    handleChannelChange,
    handleHiResChange,
    handleInvertAChange
}) {
    const {
        channel,
        msb,
        lsb,
        invert_a
    } = currentKnob;

    return (
        <div className="row editorRow">
            <div className="column">
                <label>Channel</label>
                <ChannelSelect channel={channel} handleChannelChange={handleChannelChange} />
            </div>

            <div className="column">
                <label>Control Number</label>
                <div className="row spaceAround">
                    <label>MSB</label>
                    <input type="number" min={0} max={31} value={msb} onChange={handleHiResChange} />
                    <label>LSB</label>
                    <input type="number" min={0} max={31} value={lsb} disabled />
                </div>
            </div>

            <div className="column">
                <label>
                    <input type="checkbox" checked={invert_a} onChange={handleInvertAChange} />
                    Invert
                </label>
            </div>
        </div>
    )
}

export default ControlChangeHiResForm;