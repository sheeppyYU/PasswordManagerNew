import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SectionHeaderProps {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
}

const SectionHeader = React.memo(({ title, count, isExpanded, onToggle }: SectionHeaderProps) => (
  <TouchableOpacity 
    style={styles.sectionHeader} 
    onPress={onToggle}
  >
    <View style={styles.sectionHeaderLeft}>
      <Text style={styles.sectionHeaderTitle}>
        {title.charAt(0).toUpperCase() + title.slice(1)}
      </Text>
      <View style={styles.sectionHeaderCount}>
        <Text style={styles.sectionHeaderCountText}>{count}</Text>
      </View>
    </View>
    <ChevronRight 
      size={20} 
      color="rgba(60, 60, 67, 0.6)" 
      style={{
        transform: [{ rotate: isExpanded ? '90deg' : '0deg' }]
      }}
    />
  </TouchableOpacity>
));

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60, 60, 67, 0.1)',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  sectionHeaderCount: {
    marginLeft: 8,
    backgroundColor: 'rgba(60, 60, 67, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sectionHeaderCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.7)',
  },
});

export default SectionHeader; 