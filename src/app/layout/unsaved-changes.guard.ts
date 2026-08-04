import { CanDeactivateFn } from '@angular/router';

/** Admin pages with unsaved work implement this. When the user clicks another
 *  panel option mid-edit, the guard blocks the exit and the page shakes and
 *  pulses its action buttons to explain WHY nothing happened. Leaving is only
 *  possible by saving, discarding or cancelling explicitly. */
export interface UnsavedChangesAware {
  hasUnsavedChanges(): boolean;
  notifyBlockedNavigation(): void;
}

export const unsavedChangesGuard: CanDeactivateFn<UnsavedChangesAware> = component => {
  if (component?.hasUnsavedChanges()) {
    component.notifyBlockedNavigation();
    return false;
  }
  return true;
};
