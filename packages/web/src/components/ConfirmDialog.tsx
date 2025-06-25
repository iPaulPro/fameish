import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { forwardRef, ReactNode, useImperativeHandle, useState } from "react";

export type ConfirmDialogRef = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

type ConfirmDialogProps = {
  title: string;
  description?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm: () => Promise<void>;
  onCancel?: () => Promise<void>;
  children?: ReactNode;
};

const ConfirmDialog = forwardRef<ConfirmDialogRef, ConfirmDialogProps>(
  (
    { title, description, confirmButtonText = "Confirm", cancelButtonText = "Cancel", onConfirm, onCancel, children },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleConfirm = async () => {
      await onConfirm();
      setIsOpen(false);
    };

    const handleCancel = async () => {
      if (onCancel) {
        await onCancel();
      }
      setIsOpen(false);
    };

    useImperativeHandle(
      ref,
      () => ({
        isOpen: isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
      }),
      [isOpen],
    );

    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          <DialogFooter>
            {onCancel && (
              <Button type="button" variant="secondary" onClick={handleCancel}>
                {cancelButtonText}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleConfirm}>
              {confirmButtonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);

ConfirmDialog.displayName = "ConfirmDialog";

export default ConfirmDialog;
