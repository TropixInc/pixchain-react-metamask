import dayjs from 'dayjs';
import produce from 'immer';
import { merge } from 'lodash';
import { State, Transaction } from './interfaces';

export type ReducerActions =
  | { type: 'REQUEST_SIGNING'; payload: Pick<Transaction, 'id'> }
  | { type: 'ABORT_SIGNING'; payload: Pick<Transaction, 'id'> }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'REMOVE_TRANSACTION'; payload: Pick<Transaction, 'id'> }
  | { type: 'TRANSACTION_SENT'; payload: { id: string; txHash: string } }
  | { type: 'TRANSACTION_NOTIFIED'; payload: Pick<Transaction, 'id'> }
  | { type: 'UPDATE_STATE'; payload: State };

// eslint-disable-next-line sonarjs/cognitive-complexity
export function reducer(state: State, action: ReducerActions) {
  switch (action.type) {
    case 'REQUEST_SIGNING': {
      const id = action.payload.id;

      if (state.current || state.sent[id]) {
        return state;
      }

      return produce(state, (draft) => {
        draft.current = state.pending[id];
      });
    }
    case 'ABORT_SIGNING': {
      return produce(state, (draft) => {
        draft.current = null;
      });
    }
    case 'ADD_TRANSACTION': {
      return produce(state, (draft) => {
        const id = action.payload.id;
        if (!draft.sent[id] && !draft.pending[id]) {
          draft.pending[id] = action.payload;
        }
      });
    }
    case 'REMOVE_TRANSACTION': {
      return produce(state, (draft) => {
        const id = action.payload.id;
        if (draft.pending[id]) {
          delete draft.pending[id];
        }
        if (draft.current?.id === id) {
          draft.current = null;
        }
      });
    }

    case 'TRANSACTION_SENT': {
      return produce(state, (draft) => {
        const id = action.payload.id;
        if (!draft.sent[id] && draft.pending[id]) {
          draft.sent[id] = action.payload.txHash;
          delete draft.pending[id];
        }
        draft.current = null;
      });
    }

    case 'TRANSACTION_NOTIFIED': {
      return produce(state, (draft) => {
        const id = action.payload.id;
        if (!draft.notified[id] && draft.sent[id]) {
          draft.notified[id] = dayjs().toDate();
        }
      });
    }
    case 'UPDATE_STATE': {
      return merge({}, action.payload);
    }

    default:
      throw new Error(`Invalid action ${action}`);
  }
}
