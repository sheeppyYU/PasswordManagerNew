import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Platform, ScrollView, Animated, Clipboard } from 'react-native';
import { Eye, EyeOff, Copy, ChevronRight, Edit2, Trash, MoreHorizontal, ChevronDown } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useCopyNotification } from '../hooks/useCopyNotification';

export interface PasswordItem {
  id: string;
  title: string;
  username: string;
  password: string;
  category: string;
  type: string;
  notes: string;
  favorite: boolean;
}

interface PasswordCardProps {
  item: PasswordItem;
  onDelete: (id: string, title: string) => void;
  onEdit: (item: PasswordItem) => void;
  getTypeIcon: (type: string) => JSX.Element;
  getTypeName: (typeId: string) => string;
  isDarkMode?: boolean;
}

const PasswordCard: React.FC<PasswordCardProps> = React.memo(({ item, onDelete, onEdit, getTypeIcon, getTypeName, isDarkMode = false }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { visible, message, fadeAnim, onCopyNotification } = useCopyNotification();
  const typeIcon = getTypeIcon(item.type);
  const typeName = getTypeName(item.type);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleUsernameCopy = (e: any) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    Clipboard.setString(item.username);
    if (Platform.OS === 'ios') {
      onCopyNotification(t('passwordCard.usernameCopied'));
    }
    return false;
  };

  const handlePasswordCopy = (e: any) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    Clipboard.setString(item.password);
    if (Platform.OS === 'ios') {
      onCopyNotification(t('passwordCard.passwordCopied'));
    }
    return false;
  };

  const togglePasswordVisibility = (e: any) => {
    e.preventDefault?.();
    e.stopPropagation?.();
    setShowPassword(!showPassword);
    return false;
  };

  const handleDelete = (e: any) => {
    e.stopPropagation();
    onDelete(item.id, item.title);
  };

  const handleEdit = (e: any) => {
    e.stopPropagation();
    onEdit(item);
  };

  return (
    <BlurView intensity={70} tint={isDarkMode ? "dark" : "light"} style={[
      styles.cardContainer,
      {
        borderColor: isDarkMode ? '#426F9B' : '#82B1E0',
        backgroundColor: isDarkMode ? 'rgba(66, 111, 155, 0.1)' : 'rgba(255, 255, 255, 0.8)',
      }
    ]}>
      <TouchableOpacity 
        onPress={toggleExpand}
        onLongPress={() => onDelete(item.id, item.title)}
        delayLongPress={500}
        style={[
          styles.cardHeader,
          { 
            borderBottomColor: isDarkMode ? 'rgba(66, 111, 155, 0.3)' : 'rgba(130, 177, 224, 0.3)',
            borderBottomWidth: isExpanded ? 1 : 0
          }
        ]}
      >
        <View style={styles.cardTitleContainer}>
          {typeIcon}
          <Text style={[
            styles.cardTitle,
            { color: isDarkMode ? '#D8D5D6' : '#000' }
          ]}>{item.title}</Text>
        </View>
        
        <View style={styles.cardHeaderRight}>
          <View style={[
            styles.cardBadge,
            { backgroundColor: isDarkMode ? 'rgba(160, 176, 255, 0.2)' : 'rgba(130, 177, 224, 0.15)' }
          ]}>
            <Text style={[
              styles.cardBadgeText,
              { color: isDarkMode ? '#D8D5D6' : 'rgba(60, 60, 67, 0.7)' }
            ]}>{typeName}</Text>
          </View>
          <ChevronDown 
            size={16} 
            color={isDarkMode ? "#D8D5D6" : "rgba(60, 60, 67, 0.6)"} 
            style={{
              marginLeft: 8,
              transform: [{ rotate: isExpanded ? '0deg' : '-90deg' }]
            }}
          />
        </View>
      </TouchableOpacity>
      
      {isExpanded && (
        <>
          <View style={styles.cardBody}>
            <View style={styles.credentialRow}>
              <Text style={[
                styles.credentialLabel,
                { color: isDarkMode ? '#D8D5D6' : 'rgba(60, 60, 67, 0.6)' }
              ]}>{t('passwordCard.username')}</Text>
              <View style={styles.credentialValueContainer}>
                <Text style={[
                  styles.credentialValue,
                  { color: isDarkMode ? '#D8D5D6' : '#000' }
                ]}>{item.username}</Text>
                <TouchableOpacity
                  onPress={handleUsernameCopy}
                  style={styles.copyButton}
                >
                  <Copy size={16} color={isDarkMode ? "#D8D5D6" : "#007AFF"} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.credentialRow}>
              <Text style={[
                styles.credentialLabel,
                { color: isDarkMode ? '#D8D5D6' : 'rgba(60, 60, 67, 0.6)' }
              ]}>{t('passwordCard.password')}</Text>
              <View style={styles.credentialValueContainer}>
                <Text style={[
                  styles.credentialValue,
                  { color: isDarkMode ? '#D8D5D6' : '#000' }
                ]}>
                  {showPassword ? item.password : '••••••••••••'}
                </Text>
                <View style={styles.passwordControls}>
                  <TouchableOpacity
                    onPress={togglePasswordVisibility}
                    style={styles.visibilityButton}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={isDarkMode ? "#D8D5D6" : "#007AFF"} />
                    ) : (
                      <Eye size={16} color={isDarkMode ? "#D8D5D6" : "#007AFF"} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handlePasswordCopy}
                    style={styles.copyButton}
                  >
                    <Copy size={16} color={isDarkMode ? "#D8D5D6" : "#007AFF"} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {item.notes ? (
              <View style={styles.credentialRow}>
                <Text style={[
                  styles.credentialLabel,
                  { color: isDarkMode ? '#D8D5D6' : 'rgba(60, 60, 67, 0.6)' }
                ]}>{t('passwordCard.notes')}</Text>
                <View style={[
                  styles.credentialValueContainer,
                  { alignItems: 'flex-start', width: '100%' }
                ]}>
                  <ScrollView 
                    style={{
                      maxHeight: 100,
                      width: '100%',
                      backgroundColor: isDarkMode ? 'rgba(60, 60, 67, 0.2)' : 'rgba(240, 240, 245, 0.5)',
                      borderRadius: 8,
                      padding: 8,
                      marginBottom: 4
                    }}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    contentContainerStyle={{ paddingBottom: 4 }}
                  >
                    <Text style={{
                      fontSize: 15,
                      lineHeight: 22,
                      flex: 1,
                      paddingRight: 8,
                      paddingBottom: 4,
                      color: isDarkMode ? '#D8D5D6' : '#000'
                    }}>{item.notes}</Text>
                  </ScrollView>
                </View>
              </View>
            ) : null}
            
            <View style={[
              styles.actionButtonContainer,
              { borderTopColor: isDarkMode ? 'rgba(66, 111, 155, 0.3)' : 'rgba(130, 177, 224, 0.3)' }
            ]}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <Edit2 size={14} color={isDarkMode ? '#D8D5D6' : "#007AFF"} />
                <Text style={[styles.actionButtonText, { color: isDarkMode ? '#D8D5D6' : '#007AFF' }]}>{t('common.edit')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>{t('common.delete')}</Text>
                <ChevronRight size={16} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {visible && Platform.OS === 'ios' && (
        <Animated.View
          style={[
            styles.notification,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Copy size={16} color="#FFFFFF" />
          <Text style={styles.notificationText}>{message}</Text>
        </Animated.View>
      )}
    </BlurView>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 20,
  },
  cardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(60, 60, 67, 0.1)',
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.7)',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 16,
  },
  cardBody: {
    padding: 8,
    paddingHorizontal: 12,
  },
  credentialRow: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  credentialLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(60, 60, 67, 0.6)',
    marginBottom: 4,
    paddingLeft: 4,
  },
  credentialValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
    paddingRight: 4,
    width: '100%',
  },
  credentialValue: {
    fontSize: 15,
    color: '#000',
    flex: 1,
    paddingRight: 8,
  },
  passwordControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    padding: 4,
  },
  visibilityButton: {
    padding: 4,
    marginRight: 8,
  },
  notesContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: 'rgba(60, 60, 67, 0.05)',
    borderRadius: 8,
    marginHorizontal: 4,
    maxHeight: 200,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  notesScrollView: {
    maxHeight: 54,
  },
  notesScrollContent: {
    flexGrow: 1,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
    paddingRight: 8,
    paddingBottom: 4,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    paddingHorizontal: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 4,
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 18,
  },
  notification: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginLeft: 6,
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 18,
  },
  notesScrollContainer: {
    maxHeight: 100,
    width: '100%',
    backgroundColor: 'rgba(240, 240, 245, 0.5)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
});

export default PasswordCard; 