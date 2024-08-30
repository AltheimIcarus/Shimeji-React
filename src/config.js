// fixed shimeji size in pixel
export const WIDTH = 100;
export const HEIGHT = 100;

// min and max animation repeat duration
export const MIN_DURATION_MS = 10000;
export const MAX_DURATION_MS = 20000;

// Default frame rate of animation
export const FRAME_RATE = 25;  // must be lesser than 1000, 5-25 is recommended

export const TIME_SECOND_IN_MS = 1000;

// Default FPS Interval in ms
export const FPS_INTERVAL = TIME_SECOND_IN_MS / FRAME_RATE;

export const FPS_INTERVAL_FRAME = TIME_SECOND_IN_MS / 2;

// Default gravity falling speed (px), 0.5-1 is recommended
export const GRAVITY_PIXEL = 30;

// DO NOT CHANGE, YOU MAY ADD NEW ACTION BUT DO NOT ALTER EXISTING VALUE
// available action animation of shimeji
export const ACTIONS = {
    'standing'  : 0,
    'walking'   : 1,
    'sleeping'  : 2,
    'eating'    : 3,
    'climbing'  : 4,
};