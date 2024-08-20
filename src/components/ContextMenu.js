import { React } from 'react';

// button of right click menu option

const ContextMenu = ({
    ref,
    top,
    left,
    right,
    bottom,
    remove,
    duplicate,
}) => {

    return (
        <div
            ref={ref}
            style={{
                top, left, right, bottom
            }}
            className='shimeji-menu'
        >
            <button
                onClick={remove}
                key={0}
                className='shimeji-menu-btn'
            >
                <span>Remove</span>
            </button>

            <button
                onClick={duplicate}
                key={1}
                className='shimeji-menu-btn'
            >
                <span>Duplicate</span>
            </button>
        </div>
    );

}

export default ContextMenu;