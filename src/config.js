// fixed shimeji size in pixel
export const WIDTH = 100;
export const HEIGHT = 100;

// min and max animation repeat duration
export const MIN_DURATION_MS = 10000;
export const MAX_DURATION_MS = 20000;

export const TIME_SECOND_IN_MS = 1000;

// Default frame rate of falling animation
export const FRAME_RATE_FALLING = 25;  // must be lesser than 1000, 25 is recommended

// Default FPS Interval in ms for falling animation
export const FPS_INTERVAL_FALLING = TIME_SECOND_IN_MS / FRAME_RATE_FALLING;

// Default frame rate of action animation
export const FRAME_RATE_ACTION = 1;  // 1 is recommended

// Default FPS Interval in ms for action animation
export const FPS_INTERVAL_ACTION = TIME_SECOND_IN_MS / FRAME_RATE_ACTION;

// Default gravity falling speed (px), 30 is recommended
export const GRAVITY_PIXEL = 30;

// DO NOT CHANGE, YOU MAY ADD NEW ACTION BUT DO NOT ALTER EXISTING VALUE
// available action animation of shimeji
export const ACTIONS = {
    'standing'  : 0,
    'walking'   : 1,
    'sleeping'  : 2,
    'eating'    : 3,
    'climbing'  : 4,
    'dragging'  : 5,
    'falling'  : 6,
    'landing'  : 7,
};

// Default range of non-event-based action
// event-based actions are only activated based on triggered event such as dragging the shimeji or letting shimeji fall from sky
export const MIN_ACTION_ID = 0;
export const MAX_ACTION_ID = 3;

// Move direction for walking and climbing actions
export const WALK_DIRECTION = 0;    // move in x axis
export const CLIMB_DIRECTION = 1;   // move in y axis

// Default moving speed in pixel
export const MOVE_PIXEL_POS = 10;   // 10 is recommended
export const MOVE_PIXEL_NEG = -10;   // 10 is recommended