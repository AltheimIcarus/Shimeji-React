import logo from "./logo.svg";
import "./App.css";
import Shimeji from "./Shimeji";
import { useCallback, useContext, useEffect, useRef } from "react";
import useState from "react-usestateref";
import * as utility from "./utility.js";
import * as constants from "./config.js";
import ShimejiFoodContext from "./contexts/ShimejiFoodContext.js";

function App() {
    const [Shimejis, setShimejis, ShimejisRef] = useState([
        {
            id: 1,
            shouldExplode: false,
            x: utility.randomMinMax(0, window?.innerWidth - constants.WIDTH),
            y: utility.randomMinMax(0, 100),
        },
        undefined,
    ]); // Shimeji instance(s)
    const [ShimejiFoods, setShimejiFoods, ShimejiFoodsRef] = useState([
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
    ]); // Shimeji instance(s), maximum 5 food on screen
    const [isKeyPressed, setIsKeyPressed, isKeyPressedRef] = useState(false);

    const mousePositionRef = useRef({
        x: 0,
        y: 0,
    });
    const lastFoodRef = useRef(null);

    // main function to remove a Shimeji at top level
    const removeShimeji = useCallback((id) => {
        console.log("rm:", id);
        setShimejis((prevState) => prevState.filter((sid) => sid !== id));
    }, []);

    // main function to duplicate a Shimeji at top level
    const duplicateShimeji = useCallback((id, shouldExplode = false) => {
        console.log("dup:", id);
        setShimejis((prevState) => {
            let temp = prevState;
            let newId = getValidID(temp);
            if (!newId) {
                newId = temp.length;
                temp.push({
                    id: prevState.length,
                    shouldExplode: shouldExplode,
                    x: utility.randomMinMax(
                        0,
                        window?.innerWidth - constants.WIDTH
                    ),
                    y: utility.randomMinMax(0, 100),
                });
                return temp;
            }
            temp[newId] = {
                id: prevState.length,
                shouldExplode: shouldExplode,
                x: utility.randomMinMax(
                    0,
                    window?.innerWidth - constants.WIDTH
                ),
                y: utility.randomMinMax(0, 100),
            };
            return temp;
        });
    }, []);

    // explode into mini Shimejis when reached maximum size
    const explode = async (
        id,
        x,
        y,
        width = constants.MIN_WIDTH,
        height = constants.MIN_HEIGHT
    ) => {
        // define mini Shimeji size
        const miniWidth = width;
        const miniHeight = height;

        // random mini Shimeji count to divide
        const duplicateCount =
            Math.floor(
                Math.random() *
                    (constants.MAX_EXPLODE_COUNT -
                        constants.MIN_EXPLODE_COUNT +
                        1)
            ) + constants.MIN_EXPLODE_COUNT;

        // calculate propel trajectories
        let trajectories = Array(duplicateCount).fill(undefined);
        for (let i = 0; i < duplicateCount; ++i) {
            const power =
                Math.floor(
                    Math.random() *
                        (constants.MAX_EXPLODE_POWER -
                            constants.MIN_EXPLODE_POWER +
                            1)
                ) + constants.MIN_EXPLODE_POWER;
            const angle =
                Math.floor(
                    Math.random() *
                        (constants.MAX_EXPLODE_ANGLE -
                            constants.MIN_EXPLODE_ANGLE +
                            1)
                ) + constants.MIN_EXPLODE_ANGLE;
            const direction = i < duplicateCount / 2 ? 1 : -1;
            trajectories[i] = utility.parabolicTrajectory(
                x,
                y,
                power,
                angle,
                direction
            );
        }

        // duplicate multiple mini Shimejis
        await Promise.all(
            trajectories.map(async (trajectory) => {
                // explode instead of fall
                duplicateShimeji(id, true);
            })
        );
        return;
    };

    // generate unique id for new shimeji or food to ensure no duplicate id
    const getValidID = useCallback((array) => {
        let i = 0;
        while (i < array.length) {
            if (typeof array[i] === "undefined") {
                return i;
            }
            ++i;
        }
        return null;
    }, []);

    /**
     * Consume this ShimejiFood by one and only Shimeji at first come first serve basis
     * @param {number} shimejiId ID of Shimeji that is eating this ShimejiFood
     * @param {number} foodId ID of ShimejiFood to be eaten
     * @returns {boolean} true if successfully eaten the ShimejiFood, else false
     */
    const eat = useCallback((shimejiId, foodId) => {
        if (typeof ShimejiFoodsRef.current[foodId] !== "undefined") {
            let temp = ShimejiFoodsRef.current;
            temp[foodId] = undefined;
            setShimejiFoods(temp);
            console.log(`Shimeji-${shimejiId} has eaten the food-${foodId}...`);
            return true; // successfully eaten the food
        }
        return false; // food eaten by other Shimeji
    }, []);

    const recordMousePosition = utility.debounce((e) => {
        // console.log(e.clientX, e.clientY, mousePositionRef.current.x);
        if (isKeyPressed) {
            mousePositionRef.current.x = e.clientX;
            mousePositionRef.current.y = e.clientY;
        }
    }, 100);

    const dropFood = async (e) => {
        if (e.code !== "KeyF") return;

        setIsKeyPressed(true);

        let validId = getValidID(ShimejisRef.current);
        if (validId !== null && ShimejisRef.current.length > 0) {
            let temp = ShimejiFoodsRef.current;
            temp[validId] = {
                id: validId,
                x: 0,
                y: 0,
                timestamp: Date.now(),
            };
            setShimejiFoods(temp);
        }

        setIsKeyPressed(false);
    };

    const updateFood = useCallback((foodId, x, y, width, height) => {
        const dispatch =
            ShimejiFoodsRef.current.filter(
                (food) => typeof food !== "undefined"
            ).length > 0;
        if (dispatch) {
            let temp = ShimejiFoodsRef.current;
            const update = {
                id: foodId,
                x: x,
                y: y,
                width: width,
                height: height,
                timestamp: Date.now(),
            };
            temp[foodId] = update;
            setShimejiFoods(temp);
            lastFoodRef.current = update;
        }
    }, []);

    return (
        <ShimejiFoodContext.Provider value={{ ShimejiFoodsRef, lastFoodRef }}>
            <div className="App" onMouseMove={recordMousePosition} onKeyUp={dropFood}>
                {Shimejis.map(
                    (shimeji, index) =>
                        (typeof shimeji !== 'undefined') && (
                            <Shimeji
                                id={index}
                                shouldExplode={shimeji.shouldExplode}
                                initialX={shimeji.x}
                                initialY={shimeji.y}
                                remove={removeShimeji}
                                duplicate={duplicateShimeji}
                                onEat={eat}
                                // onExplode={explode}
                            />
                        )
                )}
                {ShimejiFoods.map(
                    (food, index) =>
                        food && (
                            <ShimejiFoods
                                id={index}
                                edible={true}
                                notifyInterval={1000}
                                initialX={mousePositionRef.current}
                                initialY={mousePositionRef.current}
                                onGround={updateFood}
                            />
                        )
                )}
            </div>
        </ShimejiFoodContext.Provider>
    );
}

export default App;
