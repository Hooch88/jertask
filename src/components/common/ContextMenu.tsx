import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ContextMenu.module.css';

type MenuItem = {
  label: string;
  icon?: string;
  action?: () => void;
  submenu?: MenuItem[];
  disabled?: boolean;
};

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: MenuItem[];
  onClose: () => void;
}

export type { MenuItem };

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  items,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = React.useState<string | null>(null);

  // Adjust menu position if it would go off-screen
  useEffect(() => {
    if (menuRef.current && isOpen) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = position.x;
      let y = position.y;

      if (x + rect.width > viewportWidth) {
        x = viewportWidth - rect.width;
      }

      if (y + rect.height > viewportHeight) {
        y = viewportHeight - rect.height;
      }

      menuRef.current.style.left = `${x}px`;
      menuRef.current.style.top = `${y}px`;
    }
  }, [isOpen, position]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    
    if (item.action) {
      item.action();
      onClose();
    }
  };

  const handleSubmenuEnter = (label: string) => {
    setActiveSubmenu(label);
  };

  const handleSubmenuLeave = () => {
    setActiveSubmenu(null);
  };

  if (!isOpen) return null;

  const renderMenuItem = (item: MenuItem, index: number) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuActive = activeSubmenu === item.label;

    return (
      <div
        key={`${item.label}-${index}`}
        className={`${styles.menuItem} ${item.disabled ? styles.disabled : ''}`}
        onClick={() => handleItemClick(item)}
        onMouseEnter={() => hasSubmenu && handleSubmenuEnter(item.label)}
        onMouseLeave={handleSubmenuLeave}
        role="menuitem"
        aria-disabled={item.disabled}
      >
        {item.icon && <span className={styles.icon}>{item.icon}</span>}
        <span className={styles.label}>{item.label}</span>
        {hasSubmenu && (
          <span className={styles.submenuArrow}>▶</span>
        )}
        {hasSubmenu && isSubmenuActive && (
          <div className={styles.submenu}>
            {item.submenu!.map((subItem, subIndex) => (
              <div
                key={`${subItem.label}-${subIndex}`}
                className={`${styles.menuItem} ${subItem.disabled ? styles.disabled : ''}`}
                onClick={() => handleItemClick(subItem)}
                role="menuitem"
                aria-disabled={subItem.disabled}
              >
                {subItem.icon && <span className={styles.icon}>{subItem.icon}</span>}
                <span className={styles.label}>{subItem.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      ref={menuRef}
      className={styles.contextMenu}
      data-context-menu
      role="menu"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {items.map(renderMenuItem)}
    </div>,
    document.body
  );
}; 