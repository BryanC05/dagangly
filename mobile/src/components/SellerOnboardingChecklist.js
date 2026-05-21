import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/api';

export default function SellerOnboardingChecklist({ user, productCount = 0, colors, navigation, onUpdated, t = {} }) {
  const [qrisCode, setQrisCode] = useState(user?.qrisCode || '');
  const [pickupHours, setPickupHours] = useState(user?.pickupHours || '');
  const [saving, setSaving] = useState(false);

  const hasProducts = productCount > 0;
  const hasQris = !!(user?.qrisImageUrl || user?.qrisCode);
  const hasHours = !!user?.pickupHours;
  if (hasProducts && hasQris && hasHours) return null;

  const save = async (imageUri) => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (imageUri) {
        formData.append('qrisImage', { uri: imageUri, type: 'image/jpeg', name: 'qris.jpg' });
      }
      if (qrisCode.trim()) formData.append('qrisCode', qrisCode.trim());
      if (pickupHours.trim()) formData.append('pickupHours', pickupHours.trim());
      const res = await api.post('/users/seller/qris', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert(t.success || 'Success', 'Store settings saved');
      onUpdated?.(res.data);
    } catch (err) {
      Alert.alert(t.error || 'Error', err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const pickQris = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets?.[0]) await save(result.assets[0].uri);
  };

  return (
    <View style={{ backgroundColor: '#fffbeb', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#fde68a' }}>
      <Text style={{ fontWeight: '700', fontSize: 16, color: colors?.text, marginBottom: 8 }}>Complete your store</Text>
      {!hasProducts && (
        <TouchableOpacity onPress={() => navigation?.navigate?.('AddProduct')} style={{ marginBottom: 8 }}>
          <Text style={{ color: colors?.primary }}>+ Add your first product</Text>
        </TouchableOpacity>
      )}
      <TextInput
        placeholder="QRIS code (optional)"
        value={qrisCode}
        onChangeText={setQrisCode}
        style={{ borderWidth: 1, borderColor: colors?.border, borderRadius: 8, padding: 10, marginBottom: 8, color: colors?.text }}
        placeholderTextColor={colors?.textSecondary}
      />
      <TextInput
        placeholder="Pickup hours e.g. 08:00 - 20:00"
        value={pickupHours}
        onChangeText={setPickupHours}
        style={{ borderWidth: 1, borderColor: colors?.border, borderRadius: 8, padding: 10, marginBottom: 8, color: colors?.text }}
        placeholderTextColor={colors?.textSecondary}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity onPress={pickQris} style={{ flex: 1, backgroundColor: colors?.primary, padding: 10, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Upload QRIS</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => save(null)} disabled={saving} style={{ flex: 1, borderWidth: 1, borderColor: colors?.border, padding: 10, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: colors?.text, fontWeight: '600' }}>{saving ? '...' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
