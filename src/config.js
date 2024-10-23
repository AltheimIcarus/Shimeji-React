// fixed shimeji size in pixel
export const WIDTH = 100;
export const HEIGHT = 100;
export const MIN_WIDTH = 30;
export const MIN_HEIGHT = 30;

// fixed ShimejiFood size in pixel
export const FOOD_WIDTH = 100;
export const FOOD_HEIGHT = 100;

// default growing factor of Shimeji size after eating food
export const GROW_FACTOR = 1.1; // 110 %

// maximum grow ratio to initial width
export const MAX_GROW_RATIO = 2;

// min and max animation repeat duration
export const MIN_DURATION_MS = 10000;
export const MAX_DURATION_MS = 20000;

export const TIME_SECOND_IN_MS = 1000;

// Default frame rate of falling animation
export const FRAME_RATE_FALLING = 25;  // must be lesser than 1000, 25 is recommended

// Default FPS Interval in ms for falling animation
export const FPS_INTERVAL_FALLING = TIME_SECOND_IN_MS / FRAME_RATE_FALLING;

// Default FPS Interval in ms for chasing food animation
export const FPS_INTERVAL_CHASING_FOOD = 100; // 100 is recommended for running towards food

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
    'climbing'  : 4, // only permitted on left/right wall
    'dragging'  : 5, // animation played only when Shimeji is dragged
    'falling'  : 6, // sequence of animation following dragging to mid air
    'landing'  : 7, // sequence of animation following falling
    'eatingDroppedFood': 8, // only permitted when eating a dropped ShimejiFood
};

export const ACTIONS_MAP = Object.keys(ACTIONS);

// Default range of non-event-based action
// event-based actions are only activated based on triggered event such as dragging the shimeji or letting shimeji fall from sky
export const MIN_ACTION_ID = 0;
export const MAX_ACTION_ID = 3;

// Default moving speed in pixel
export const MOVE_PIXEL_POS = 10;   // 10 is recommended
export const MOVE_PIXEL_NEG = -10;   // 10 is recommended

// Maximum number of Shimeji feed drop allowed at a same time
export const MAX_FOOD_COUNT = 5;

// Maximum count of mini Shimejis to divide after explosion
export const MAX_EXPLODE_COUNT = 10;
// Minimum count of mini Shimejis to divide after explosion
export const MIN_EXPLODE_COUNT = 5;
// Maximum explosion force/power
export const MAX_EXPLODE_POWER = 90;
// Minimum explosion force/power
export const MIN_EXPLODE_POWER = 10;
// Maximum explosion angle (deg)
export const MAX_EXPLODE_ANGLE = 90;
// Minimum explosion angle (deg)
export const MIN_EXPLODE_ANGLE = 30;