export const MOCK_USERS = {
  buyers: [
    {
      id: "mock_buyer_1",
      email: "buyer@test.com",
      password: "test123",
      name: "Test Buyer",
      phone: "081300000001",
      isSeller: false,
      isDriver: false,
      businessName: null,
      businessType: "",
      location: {
        type: "Point",
        coordinates: [107.0005431266569, -6.225322353190125],
        address: "Summarecon Bekasi",
        city: "Bekasi",
        state: "Jawa Barat",
      },
      addresses: [
        {
          id: "addr_1",
          label: "Rumah",
          address: "Jl. Boulevard Ahmad Yani No. 123, Summarecon Bekasi",
          city: "Bekasi",
          state: "Jawa Barat",
          postalCode: "17142",
          isDefault: true,
        },
      ],
      profileImage: null,
      automationEnabled: false,
    },
    {
      id: "mock_buyer_2",
      email: "andi.buyer@marketplace.test",
      password: "test123",
      name: "Andi Wijaya",
      phone: "081300000101",
      isSeller: false,
      isDriver: false,
      businessName: null,
      businessType: "",
      location: {
        type: "Point",
        coordinates: [107.0005431266569, -6.225322353190125],
        address: "Ruko Emerald Commercial, Summarecon Bekasi",
        city: "Bekasi",
        state: "Jawa Barat",
        pincode: "17142",
      },
      addresses: [
        {
          id: "addr_2",
          label: "Rumah",
          address: "Ruko Emerald Commercial, Summarecon Bekasi",
          city: "Bekasi",
          state: "Jawa Barat",
          postalCode: "17142",
          isDefault: true,
        },
      ],
      profileImage: null,
      automationEnabled: false,
    },
  ],
  sellers: [
    {
      id: "mock_seller_1",
      email: "seller@test.com",
      password: "test123",
      name: "Test Seller",
      phone: "081300000002",
      isSeller: true,
      isDriver: false,
      businessName: "Test Store",
      businessType: "small",
      location: {
        type: "Point",
        coordinates: [107.0005431266569, -6.225322353190125],
        address: "Ruko Test, Summarecon Bekasi",
        city: "Bekasi",
        state: "Jawa Barat",
      },
      profileImage: null,
      automationEnabled: false,
    },
    {
      id: "mock_seller_2",
      email: "rani.summarecon@marketplace.test",
      password: "test123",
      name: "Rani Pratama",
      phone: "081300000101",
      isSeller: true,
      isDriver: false,
      businessName: "Dapur Summarecon",
      businessType: "small",
      location: {
        type: "Point",
        coordinates: [107.0005431266569, -6.225322353190125],
        address: "Ruko Emerald Commercial, Summarecon Bekasi",
        city: "Bekasi",
        state: "Jawa Barat",
      },
      profileImage: null,
      automationEnabled: false,
    },
  ],
  drivers: [
    {
      id: "mock_driver_1",
      email: "driver@test.com",
      password: "test123",
      name: "Test Driver",
      phone: "081300000003",
      isSeller: false,
      isDriver: true,
      businessName: null,
      businessType: "",
      location: {
        type: "Point",
        coordinates: [107.0005431266569, -6.225322353190125],
        address: "Summarecon Bekasi",
        city: "Bekasi",
        state: "Jawa Barat",
      },
      profileImage: null,
      automationEnabled: false,
    },
  ],
};

export function findMockUser(email, password) {
  const allUsers = [
    ...MOCK_USERS.buyers,
    ...MOCK_USERS.sellers,
    ...MOCK_USERS.drivers,
  ];
  
  const user = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  
  if (user && user.password === password) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  return null;
}

export function generateMockToken(user) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 86400 * 7,
      id: user.id,
      isSeller: user.isSeller,
    })
  );
  const signature = btoa("mock_signature");
  return `${header}.${payload}.${signature}`;
}

export function validateMockToken(token) {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getMockUserById(userId) {
  const allUsers = [
    ...MOCK_USERS.buyers,
    ...MOCK_USERS.sellers,
    ...MOCK_USERS.drivers,
  ];
  
  const user = allUsers.find((u) => u.id === userId);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

export function getMockUserByEmail(email) {
  const allUsers = [
    ...MOCK_USERS.buyers,
    ...MOCK_USERS.sellers,
    ...MOCK_USERS.drivers,
  ];
  
  const user = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

export default {
  MOCK_USERS,
  findMockUser,
  generateMockToken,
  validateMockToken,
  getMockUserById,
  getMockUserByEmail,
};
