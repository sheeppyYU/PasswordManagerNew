import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import { Dimensions, StyleSheet } from 'react-native';

export interface BottomSheetWrapperHandles {
  expand: () => void;
  close: () => void;
}

interface BottomSheetWrapperProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[]; // e.g. ['50%', '90%']
  onClose?: () => void;
}

const BottomSheetWrapper = forwardRef<BottomSheetWrapperHandles, BottomSheetWrapperProps>(
  ({ children, snapPoints, onClose }, ref) => {
    const defaultSnapPoints = snapPoints || ['50%', '90%'];
    const sheetRef = useRef<BottomSheet>(null);

    // Expose imperative methods to parent via ref
    useImperativeHandle(ref, () => ({
      expand: () => sheetRef.current?.expand(),
      close: () => sheetRef.current?.close(),
    }));

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1} // collapsed initially
        snapPoints={defaultSnapPoints}
        enablePanDownToClose
        onClose={onClose}
        style={styles.sheet}
      >
        {children}
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default BottomSheetWrapper;
