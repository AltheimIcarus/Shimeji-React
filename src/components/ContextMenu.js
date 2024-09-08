import { React } from 'react';
import './ContextMenu.css';

// button of right click menu option

const ContextMenu = ({
    contextMenuRef,
    isToggled,
    positionY,
    positionX,
    remove,
    // duplicate,
}) => {

    const handleRemove = (e) => {
        e.stopPropagation();
        remove();
    }

    // const handleDuplicate = (e) => {
    //     e.stopPropagation();
    //     duplicate();
    // }

    return (
        <div
            style={{
                top: positionY + 2 + 'px',
                left: positionX + 2 + 'px'
            }}
            className={`shimeji-menu ${isToggled? 'active' : 'inactive'}`}
            ref={contextMenuRef}
        >
            <button
                onClick={handleRemove}
                key={0}
                className='shimeji-menu-btn'
            >
                <span>Remove</span>
            </button>

            {/* <button
                onClick={handleDuplicate}
                key={1}
                className='shimeji-menu-btn'
            >
                <span>Duplicate</span>
            </button> */}
        </div>
    );

}

export default ContextMenu;