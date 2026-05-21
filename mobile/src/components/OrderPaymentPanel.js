import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import { getImageUrl } from '../utils/helpers';

export default function OrderPaymentPanel({ order, user, colors, onUpdated, t = {} }) {
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const orderId = order._id;
  const isBuyer = String(order.buyer?._id || order.buyer) === String(user?.id);
  const isSeller = String(order.seller?._id || order.seller) === String(user?.id);
  const isQris = order.paymentMethod === 'qris' || order.payment_method === 'qris';
  const isCash = order.paymentMethod === 'cash' || order.payment_method === 'cash';
  const paymentStatus = order.paymentStatus || order.payment_status || 'pending';
  const details = order.paymentDetails || order.payment_details || {};
  const qrisUrl = details.qrisUrl || details.qris_url || order.seller?.qrisImageUrl;
  const proofUrl = details.transferProof || details.transfer_proof;

  const uploadProof = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t.error || 'Error', 'Photo permission required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('paymentProof', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'proof.jpg',
      });
      const res = await api.post(`/orders/${orderId}/payment-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert(t.success || 'Success', t.paymentSubmittedApproval || 'Proof uploaded');
      onUpdated?.(res.data);
    } catch (err) {
      Alert.alert(t.error || 'Error', err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const markPaid = async () => {
    setConfirming(true);
    try {
      const res = await api.put(`/orders/${orderId}/payment`, { paymentStatus: 'completed' });
      Alert.alert(t.success || 'Success', t.paymentSuccessful || 'Payment confirmed');
      onUpdated?.(res.data);
    } catch (err) {
      Alert.alert(t.error || 'Error', err.response?.data?.message || 'Failed');
    } finally {
      setConfirming(false);
    }
  };

  if (order.status !== 'payment_pending' && paymentStatus === 'completed') {
    return (
      <View style={{ padding: 12, backgroundColor: '#d1fae5', borderRadius: 10, marginTop: 8 }}>
        <Text style={{ color: '#065f46', fontWeight: '600' }}>Payment confirmed</Text>
      </View>
    );
  }

  if (order.status !== 'payment_pending') return null;

  return (
    <View style={{ marginTop: 12, padding: 14, backgroundColor: colors?.card, borderRadius: 12, borderWidth: 1, borderColor: colors?.border }}>
      <Text style={{ fontWeight: '700', color: colors?.text, marginBottom: 8 }}>
        {isQris ? (t.paymentMethod || 'QRIS payment') : 'Cash on pickup'}
      </Text>
      {isCash && (
        <Text style={{ color: colors?.textSecondary, fontSize: 13, marginBottom: 8 }}>
          Customer pays in cash when picking up.
        </Text>
      )}
      {isQris && qrisUrl && (
        <Image source={{ uri: getImageUrl(qrisUrl) }} style={{ width: 200, height: 200, alignSelf: 'center', borderRadius: 8 }} resizeMode="contain" />
      )}
      {isQris && !qrisUrl && (
        <Text style={{ color: colors?.textSecondary, fontSize: 13 }}>Seller QRIS not set up yet.</Text>
      )}
      {proofUrl && (
        <Text style={{ color: colors?.primary, marginTop: 8, fontSize: 13 }}>Proof uploaded</Text>
      )}
      {isBuyer && isQris && paymentStatus !== 'proof_submitted' && (
        <TouchableOpacity
          style={{ marginTop: 10, backgroundColor: colors?.primary, padding: 12, borderRadius: 10, alignItems: 'center' }}
          onPress={uploadProof}
          disabled={uploading}
        >
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>{t.submitPayment || 'Upload proof'}</Text>}
        </TouchableOpacity>
      )}
      {isSeller && (
        <TouchableOpacity
          style={{ marginTop: 10, backgroundColor: '#22c55e', padding: 12, borderRadius: 10, alignItems: 'center' }}
          onPress={markPaid}
          disabled={confirming}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>{confirming ? '...' : (t.confirmPayment || 'Mark paid')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
