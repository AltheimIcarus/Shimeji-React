import { React, useCallback, useEffect } from "react";
import useState from "react-usestateref";
import * as constants from "../config";
import { ACTIONS_SOURCES } from "./ShimejiSources";
import { UseFrameLoop } from "./UseFrameLoop";

// util function to mimic sleep()
const sleep = async (timeMs) => {
    await new Promise((r) => setTimeout(r, timeMs));
};

const ShimejiFrame = ({
    key,
    actionName,
    actionID,
    currentAction,
    rotation,
    currFrame,
}) => {
    return (
        <div
            className="shimeji-frame-container"
            style={{
                visibility: currentAction === actionID ? "visible" : "hidden",
                opacity: currentAction === actionID ? 1 : 0,
                transform: currentAction === actionID ? `${rotation}` : "none",
            }}
            id={`${actionName}`}
        >
            {ACTIONS_SOURCES[actionName].map((frame, index) => (
                frame && (<img
                    src={frame}
                    style={{
                        opacity:
                            index === currFrame && currentAction === actionID
                                ? "1"
                                : "0",
                    }}
                    className="shimeji-frame"
                    key={index}
                    alt={`shimeji-frame-${actionName}-${index}`}
                />)
            ))}
        </div>
    );
};

export default ShimejiFrame;
