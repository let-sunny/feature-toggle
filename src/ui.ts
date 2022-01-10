import '@webcomponents/custom-elements/src/native-shim';
import '@webcomponents/custom-elements/custom-elements.min';

import {
  APP_EVENTS,
  APP_TAG_NAME,
  getAppElement,
  getContextMenu,
} from './components/app/App';
import { CONTAINER_TAG_NAME } from './components/feature-container/FeatureContainer';
import {
  CONTEXT_MENU_TAG_NAME,
  EVENTS,
} from './components/context-menu/ContextMenu';

import './components';
import './ui.css';

// UI event handler
class UIEventHandler {
  constructor() {
    this.onMessageFromFigma();
    this.onDropFromFigma();
    this.onContextMenu();
    this.onRequestChangeNodeVisible();
    this.onRequestUpdatedFeatures();
    this.onKeyPressed();
    this.onRequestSync();
    this.onDoubleClick();
  }

  onMessageFromFigma() {
    onmessage = (event) => {
      const { type, value } = event.data.pluginMessage;
      switch (type) {
        case 'INIT_FEATURES': {
          const app = document.createElement(APP_TAG_NAME);
          app.setAttribute('features', JSON.stringify(value.features));
          document.querySelector('#ui')?.appendChild(app);
          break;
        }
        case 'UPDATE_FEATURES': {
          getAppElement()?.dispatchEvent(
            new CustomEvent(APP_EVENTS.RELOAD_FEATURES, {
              detail: { features: value.features },
            })
          );
          break;
        }
        case 'UPDATE_SELECTION': {
          getAppElement()?.setAttribute(
            'selection',
            JSON.stringify(value.nodes)
          );
          break;
        }
        default:
          throw new Error('Unknown message type');
      }
    };
  }

  onDropFromFigma() {
    let dropFromFigma = false;
    document.addEventListener('mousedown', () => {
      dropFromFigma = false;
    });
    document.addEventListener('mouseup', (event: MouseEvent) => {
      if (dropFromFigma) {
        const target = event.composedPath() as HTMLElement[];
        const feature = target.find(
          (el) => el.tagName === CONTAINER_TAG_NAME.toUpperCase()
        );

        if (feature) {
          getAppElement()?.dispatchEvent(
            new CustomEvent(APP_EVENTS.ADD_NODES, {
              detail: {
                featureId: feature.id,
              },
            })
          );
        }
      }
      dropFromFigma = false;
    });
    document.addEventListener('mouseleave', () => {
      dropFromFigma = true;
    });
  }

  onContextMenu() {
    document.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault();

      getContextMenu()?.dispatchEvent(
        new CustomEvent(EVENTS.OPEN_CONTEXT_MENU, {
          detail: event,
        })
      );
    });
    document.addEventListener('click', (event: MouseEvent) => {
      const closed = (event.composedPath() as HTMLElement[]).every(
        (target) => target.tagName !== CONTEXT_MENU_TAG_NAME.toUpperCase()
      );
      if (closed) {
        getContextMenu()?.dispatchEvent(
          new CustomEvent(EVENTS.CLOSE_CONTEXT_MENU)
        );
      }
    });
  }

  onKeyPressed() {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        getAppElement()?.dispatchEvent(new CustomEvent(APP_EVENTS.DELETE_ITEM));
      } else if (event.key.toUpperCase() === 'R') {
        getAppElement()?.dispatchEvent(
          new CustomEvent(APP_EVENTS.REQUEST_RENAME_FEATURE)
        );
      }
    });
  }

  onDoubleClick() {
    document.addEventListener('dblclick', () => {
      getAppElement()?.dispatchEvent(
        new CustomEvent(APP_EVENTS.REQUEST_RENAME_FEATURE)
      );
    });
  }

  onRequestChangeNodeVisible() {
    document.addEventListener(APP_EVENTS.REQUEST_CHANGE_NODE_VISIBLE, ((
      event: CustomEvent
    ) => {
      parent.postMessage(
        {
          pluginMessage: {
            type: APP_EVENTS.REQUEST_CHANGE_NODE_VISIBLE,
            nodes: event.detail.nodes,
            visible: event.detail.visible,
          },
        },
        '*'
      );
    }) as EventListener);
  }

  onRequestUpdatedFeatures() {
    document.addEventListener(APP_EVENTS.REQUEST_UPDATE_FEATURES, ((
      event: CustomEvent
    ) => {
      parent.postMessage(
        {
          pluginMessage: {
            type: APP_EVENTS.REQUEST_UPDATE_FEATURES,
            features: event.detail.features,
          },
        },
        '*'
      );
    }) as EventListener);
  }

  onRequestSync() {
    document.addEventListener(APP_EVENTS.REQUEST_SYNC_FEATURES, (() => {
      parent.postMessage(
        {
          pluginMessage: {
            type: APP_EVENTS.REQUEST_SYNC_FEATURES,
          },
        },
        '*'
      );
    }) as EventListener);
  }
}

new UIEventHandler();
