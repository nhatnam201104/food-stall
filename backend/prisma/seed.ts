import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── 1. Roles ───────────────────────────────────────────────────────────────
  const [touristRole, merchantRole, adminRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'tourist' },
      update: {},
      create: { name: 'tourist', description: 'Khách tham quan' },
    }),
    prisma.role.upsert({
      where: { name: 'merchant' },
      update: {},
      create: { name: 'merchant', description: 'Chủ gian hàng' },
    }),
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: { name: 'admin', description: 'Quản trị viên hệ thống' },
    }),
  ]);

  console.log('✅ Roles: tourist, merchant, admin');

  // ─── 2. Users ────────────────────────────────────────────────────────────────
  const [adminPwd, merchantPwd, touristPwd] = await Promise.all([
    bcrypt.hash('Admin@123456', 12),
    bcrypt.hash('Merchant@123', 12),
    bcrypt.hash('Tourist@123', 12),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@audiotourguide.com' },
    update: {},
    create: {
      roleId: adminRole.id,
      fullName: 'System Administrator',
      email: 'admin@audiotourguide.com',
      passwordHash: adminPwd,
      phone: '0900000000',
      isActive: true,
    },
  });

  const merchantUser1 = await prisma.user.upsert({
    where: { email: 'merchant1@example.com' },
    update: {},
    create: {
      roleId: merchantRole.id,
      fullName: 'Nguyễn Văn Thành',
      email: 'merchant1@example.com',
      passwordHash: merchantPwd,
      phone: '0911111111',
      isActive: true,
    },
  });

  const merchantUser2 = await prisma.user.upsert({
    where: { email: 'merchant2@example.com' },
    update: {},
    create: {
      roleId: merchantRole.id,
      fullName: 'Trần Thị Hoa',
      email: 'merchant2@example.com',
      passwordHash: merchantPwd,
      phone: '0922222222',
      isActive: true,
    },
  });

  const touristUser1 = await prisma.user.upsert({
    where: { email: 'tourist1@example.com' },
    update: {},
    create: {
      roleId: touristRole.id,
      fullName: 'Lê Minh Khoa',
      email: 'tourist1@example.com',
      passwordHash: touristPwd,
      phone: '0933333333',
      isActive: true,
    },
  });

  const touristUser2 = await prisma.user.upsert({
    where: { email: 'tourist2@example.com' },
    update: {},
    create: {
      roleId: touristRole.id,
      fullName: 'Phạm Ngọc Lan',
      email: 'tourist2@example.com',
      passwordHash: touristPwd,
      phone: '0944444444',
      isActive: true,
    },
  });

  console.log('✅ Users: admin, 2 merchants, 2 tourists');

  // ─── 3. Merchants ────────────────────────────────────────────────────────────
  const merchant1 = await prisma.merchant.upsert({
    where: { userId: merchantUser1.id },
    update: {},
    create: {
      userId: merchantUser1.id,
      shopName: 'Quán Bún Bò Huế Bà Thành',
      address: '12 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
      contactEmail: 'merchant1@example.com',
      logoUrl: 'https://placehold.co/200x200?text=BunBo',
      coverImageUrl: 'https://placehold.co/800x300?text=BunBo+Cover',
    },
  });

  const merchant2 = await prisma.merchant.upsert({
    where: { userId: merchantUser2.id },
    update: {},
    create: {
      userId: merchantUser2.id,
      shopName: 'Bánh Mì Phượng – Hội An',
      address: '2B Phan Châu Trinh, Phố Cổ Hội An, Quảng Nam',
      contactEmail: 'merchant2@example.com',
      logoUrl: 'https://placehold.co/200x200?text=BanhMi',
      coverImageUrl: 'https://placehold.co/800x300?text=BanhMi+Cover',
    },
  });

  console.log(`✅ Merchants: ${merchant1.shopName}, ${merchant2.shopName}`);

  // ─── 4. Points of Interest ───────────────────────────────────────────────────
  const poisData = [
    // Merchant 1 – Bún Bò Huế (Quận 1, TP.HCM)
    {
      merchantId: merchant1.id,
      name: 'Quầy Bún Bò Đặc Biệt',
      description:
        'Thưởng thức tô bún bò Huế chuẩn vị xứ Huế, nước dùng hầm xương bò 8 tiếng với sả và mắm ruốc thơm nức. Mỗi tô đều có thịt bò tái, chả cua và huyết.',
      address: 'Khu A – Hội chợ ẩm thực Quận 1',
      imageUrl: 'https://placehold.co/600x400?text=Bun+Bo+Hue',
      latitude: 10.7769,
      longitude: 106.7009,
      radiusMeters: 20,
      priority: 1,
      approvalStatus: 'approved',
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      audioMode: 'tts',
      cooldownSeconds: 30,
    },
    {
      merchantId: merchant1.id,
      name: 'Góc Trưng Bày Gia Vị Truyền Thống',
      description:
        'Khám phá bộ sưu tập gia vị đặc trưng miền Trung: mắm ruốc Huế, ruốc bò, ớt bột và các loại thảo mộc tạo nên linh hồn của nồi bún bò chính gốc.',
      address: 'Khu A – Hội chợ ẩm thực Quận 1',
      imageUrl: 'https://placehold.co/600x400?text=Gia+Vi',
      latitude: 10.7771,
      longitude: 106.7012,
      radiusMeters: 15,
      priority: 2,
      approvalStatus: 'approved',
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      audioMode: 'tts',
      cooldownSeconds: 20,
    },
    {
      merchantId: merchant1.id,
      name: 'Khu Vực Dùng Bữa & Trải Nghiệm',
      description:
        'Khu vực ngồi dùng bữa theo phong cách nhà cổ Huế. Thực khách có thể tự tay thêm rau thơm, giá đỗ, chanh tươi và ớt xiêm theo khẩu vị cá nhân.',
      address: 'Khu A – Hội chợ ẩm thực Quận 1',
      imageUrl: 'https://placehold.co/600x400?text=Dining+Area',
      latitude: 10.7767,
      longitude: 106.7007,
      radiusMeters: 25,
      priority: 3,
      approvalStatus: 'approved',
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      audioMode: 'tts',
      cooldownSeconds: 30,
    },
    // Merchant 2 – Bánh Mì Phượng (Hội An)
    {
      merchantId: merchant2.id,
      name: 'Quầy Bánh Mì Phượng Chính Gốc',
      description:
        "Bánh mì Phượng – niềm tự hào của phố cổ Hội An, từng được Anthony Bourdain ca ngợi là \"chiếc bánh mì ngon nhất thế giới\". Vỏ bánh giòn rụm, nhân đa dạng gồm pate, thịt nướng, rau sống và nước sốt bí truyền.",
      address: '2B Phan Châu Trinh, Hội An',
      imageUrl: 'https://placehold.co/600x400?text=Banh+Mi+Phuong',
      latitude: 15.8801,
      longitude: 108.3357,
      radiusMeters: 15,
      priority: 1,
      approvalStatus: 'approved',
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      audioMode: 'tts',
      cooldownSeconds: 30,
    },
    {
      merchantId: merchant2.id,
      name: 'Góc Lịch Sử Bánh Mì Hội An',
      description:
        'Tìm hiểu hành trình 30 năm hình thành thương hiệu bánh mì Phượng. Không gian trưng bày ảnh tư liệu, câu chuyện về bà Phượng và bí quyết làm bánh được truyền từ thế hệ này sang thế hệ khác.',
      address: '2B Phan Châu Trinh, Hội An',
      imageUrl: 'https://placehold.co/600x400?text=Lich+Su+Banh+Mi',
      latitude: 15.8803,
      longitude: 108.3359,
      radiusMeters: 12,
      priority: 2,
      approvalStatus: 'approved',
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      audioMode: 'tts',
      cooldownSeconds: 25,
    },
    {
      merchantId: merchant2.id,
      name: 'Xưởng Làm Bánh – Trải Nghiệm Trực Tiếp',
      description:
        'Tham quan khu vực làm bánh và tự tay nặn ổ bánh mì mini dưới sự hướng dẫn của thợ bánh lành nghề. Hoạt động thú vị cho gia đình và du khách quốc tế.',
      address: '2B Phan Châu Trinh, Hội An',
      imageUrl: 'https://placehold.co/600x400?text=Xuong+Lam+Banh',
      latitude: 15.8799,
      longitude: 108.3355,
      radiusMeters: 18,
      priority: 3,
      approvalStatus: 'pending',
      audioMode: 'tts',
      cooldownSeconds: 40,
    },
    // Additional POIs for Top 10 Rankings
    {
      merchantId: merchant1.id,
      name: 'Khu Vực Chế Biến Nước Dùng',
      description:
        'Quan sát quy trình hầm xương bò và nấu nước dùng theo phương pháp truyền thống. Bếp trưởng sẽ giới thiệu các loại gia vị và thời gian ninh xương để tạo nên hương vị đặc trưng.',
      address: 'Khu A – Hội chợ ẩm thực Quận 1',
      imageUrl: 'https://placehold.co/600x400?text=Nham+Xuong',
      latitude: 10.7773,
      longitude: 106.7015,
      radiusMeters: 20,
      priority: 4,
      approvalStatus: 'approved',
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      audioMode: 'tts',
      cooldownSeconds: 35,
    },
    {
      merchantId: merchant2.id,
      name: 'Góc Làm Topping Bánh Mì',
      description:
        'Khám phá bí quyết làm các loại topping bánh mì đặc biệt: thịt nướng than hoa, chả lụa, pate gan và nước sốt bí truyền của quán bánh mì Phượng.',
      address: '2B Phan Châu Trinh, Hội An',
      imageUrl: 'https://placehold.co/600x400?text=Topping+Banh+Mi',
      latitude: 15.8797,
      longitude: 108.3353,
      radiusMeters: 15,
      priority: 4,
      approvalStatus: 'approved',
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      audioMode: 'tts',
      cooldownSeconds: 30,
    },
    {
      merchantId: merchant1.id,
      name: 'Khu Vực Tạo Hình Bún Huế',
      description:
        'Tham quan quy trình làm bánh bún thủ công từ bột gạo. Tìm hiểu cách tạo nên sợi bún mỏng, dai và cách bảo quản để giữ được độ tươi ngon.',
      address: 'Khu A – Hội chợ ẩm thực Quận 1',
      imageUrl: 'https://placehold.co/600x400?text=Lam+Bun',
      latitude: 10.7765,
      longitude: 106.7005,
      radiusMeters: 18,
      priority: 5,
      approvalStatus: 'approved',
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      audioMode: 'tts',
      cooldownSeconds: 25,
    },
    {
      merchantId: merchant2.id,
      name: 'Góc Bán Hàng & Bao Gì',
      description:
        'Quầy bán hàng nơi nhân viên giao bánh mì cho khách hàng. Quan sát quy trình đóng gói, giao hàng và cách nhân viên tư vấn cho khách du lịch quốc tế.',
      address: '2B Phan Châu Trinh, Hội An',
      imageUrl: 'https://placehold.co/600x400?text=Giao+Hang',
      latitude: 15.8795,
      longitude: 108.3351,
      radiusMeters: 12,
      priority: 5,
      approvalStatus: 'approved',
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
      audioMode: 'tts',
      cooldownSeconds: 20,
    },
  ];

  const createdPois: any[] = [];
  for (const data of poisData) {
    const existing = await prisma.pointOfInterest.findFirst({
      where: { name: data.name, merchantId: data.merchantId },
    });
    if (!existing) {
      const poi = await prisma.pointOfInterest.create({ data: data as any });
      createdPois.push(poi);
    } else {
      createdPois.push(existing);
    }
  }

  console.log(`✅ Points of Interest: ${createdPois.length} POIs`);

  // ─── 5. POI Audio (VI + EN) ──────────────────────────────────────────────────
  const audioContents: Record<string, { vi: string; en: string }> = {
    'Quầy Bún Bò Đặc Biệt': {
      vi: 'Chào mừng quý khách đến với quầy bún bò Huế đặc biệt. Tô bún được hầm từ xương bò trong 8 tiếng, kết hợp sả, mắm ruốc và các loại thảo mộc truyền thống xứ Huế. Hãy thưởng thức và cảm nhận hương vị chuẩn miền Trung ngay tại đây.',
      en: 'Welcome to our special Hue-style beef noodle soup stall. Our broth is simmered for 8 hours with beef bones, lemongrass, shrimp paste and traditional Central Vietnamese herbs. Enjoy an authentic taste of Hue cuisine right here.',
    },
    'Góc Trưng Bày Gia Vị Truyền Thống': {
      vi: 'Bạn đang đứng trước góc trưng bày gia vị truyền thống miền Trung. Đây là nơi lưu giữ linh hồn của ẩm thực Huế: mắm ruốc lên men tự nhiên, ớt bột đỏ thắm và các loại thảo mộc đặc hữu. Mỗi loại gia vị đều mang một câu chuyện văn hóa riêng.',
      en: 'You are standing at traditional Central Vietnamese spice display. This is where soul of Hue cuisine is preserved: naturally fermented shrimp paste, vibrant red chili powder and regional herbs. Each spice carries its own cultural story.',
    },
    'Khu Vực Dùng Bữa & Trải Nghiệm': {
      vi: 'Khu vực dùng bữa được thiết kế theo phong cách nhà cổ xứ Huế, mang lại không gian ấm cúng và thân thiện. Quý khách có thể tự điều chỉnh hương vị với rau thơm tươi và các loại gia vị bày sẵn trên bàn.',
      en: 'The dining area is designed in style of a traditional Hue house, creating a warm and friendly atmosphere. Guests can customize flavors with fresh herbs and condiments arranged on the table.',
    },
    'Quầy Bánh Mì Phượng Chính Gốc': {
      vi: 'Chào mừng bạn đến với bánh mì Phượng – huyền thoại ẩm thực của phố cổ Hội An. Chiếc bánh mì này đã chinh phục hàng triệu thực khách quốc tế và được nhiều đầu bếp nổi tiếng thế giới ca ngợi. Hãy cắn một miếng và cảm nhận sự khác biệt.',
      en: 'Welcome to Banh Mi Phuong – the culinary legend of Hoi An Ancient Town. This banh mi has won over millions of international food lovers and been praised by world-renowned chefs. Take a bite and taste the difference.',
    },
    'Góc Lịch Sử Bánh Mì Hội An': {
      vi: 'Không gian này kể lại hành trình hơn 30 năm của bà Phượng gắn bó với chiếc bánh mì. Từ một gánh hàng nhỏ trên vỉa hè, bánh mì Phượng đã trở thành biểu tượng ẩm thực của Hội An và là điểm đến không thể bỏ lỡ của du khách khắp thế giới.',
      en: "This space tells the story of Ms. Phuong's 30-year journey with banh mi. From a small street cart, Banh Mi Phuong has become a culinary icon of Hoi An and a must-visit destination for travelers from around the world.",
    },
    'Xưởng Làm Bánh – Trải Nghiệm Trực Tiếp': {
      vi: 'Đây là khu vực bếp nơi những chiếc bánh mì được tạo ra mỗi ngày. Du khách có thể quan sát quy trình làm bánh hoặc đăng ký tự tay nhào bột và tạo hình bánh dưới sự hướng dẫn của các nghệ nhân.',
      en: 'This is the bakery area where banh mi are made fresh every day. Visitors can observe the bread-making process or sign up to knead and shape dough under the guidance of skilled bakers.',
    },
    'Khu Vực Chế Biến Nước Dùng': {
      vi: 'Chào mừng đến với khu vực chế biến nước dùng. Đây là nơi các đầu bếp hầm xương bò trong 8 tiếng để tạo nên hương vị đậm đà đặc trưng. Quý khách có thể quan sát quy trình và tìm hiểu các loại gia vị bí truyền.',
      en: 'Welcome to the broth preparation area. This is where chefs simmer beef bones for 8 hours to create the rich, authentic flavor. Guests can observe the process and learn about the secret spices used.',
    },
    'Góc Làm Topping Bánh Mì': {
      vi: 'Đây là khu vực làm các loại topping bánh mì đặc biệt. Thưởng thức thịt nướng than hoa thơm nức, chả lụa giòn tan và nước sốt bí truyền của bánh mì Phượng. Mỗi topping đều được chế biến tươi mỗi ngày.',
      en: 'This is where we make the special banh mi toppings. Enjoy the fragrant charcoal-grilled meat, crispy pork sausage, and Phuong secret sauce. Each topping is prepared fresh daily.',
    },
    'Khu Vực Tạo Hình Bún Huế': {
      vi: 'Chào mừng đến với xưởng làm bánh bún thủ công. Tìm hiểu quy trình từ bột gạo đến sợi bún mỏng, dai. Các nghệ nhân sẽ giới thiệu cách tạo hình bánh bún truyền thống và bảo quản để giữ độ tươi ngon.',
      en: 'Welcome to the handmade rice noodle workshop. Learn the process from rice flour to thin, chewy noodles. Artisans will demonstrate traditional noodle shaping and preservation techniques.',
    },
    'Góc Bán Hàng & Bao Gì': {
      vi: 'Đây là quầy bán hàng chính của bánh mì Phượng. Quan sát cách nhân viên giao bánh, đóng gói và tư vấn cho khách du lịch quốc tế. Vị trí này đón hàng trăm khách mỗi ngày.',
      en: 'This is the main sales counter of Banh Mi Phuong. Observe how staff serve, package, and advise international tourists. This location welcomes hundreds of customers daily.',
    },
  };

  let audioCount = 0;
  for (const poi of createdPois) {
    const content = audioContents[poi.name];
    if (!content) continue;
    for (const [lang, text] of Object.entries(content)) {
      const exists = await prisma.poiAudio.findFirst({
        where: { poiId: poi.id, languageCode: lang },
      });
      if (!exists) {
        await prisma.poiAudio.create({
          data: { poiId: poi.id, languageCode: lang, ttsContent: text, status: 'active' },
        });
        audioCount++;
      }
    }
  }

  console.log(`✅ POI Audio: ${audioCount} entries (VI + EN)`);

  // ─── 6. Tours ────────────────────────────────────────────────────────────────
  const tourHCM = await prisma.tour.upsert({
    where: { id: 'seed-tour-hcm-001' },
    update: {},
    create: {
      id: 'seed-tour-hcm-001',
      createdBy: adminUser.id,
      name: 'Hành Trình Ẩm Thực Sài Gòn',
      description:
        'Khám phá tinh hoa ẩm thực Việt Nam tại trái tim thành phố Hồ Chí Minh. Tour dẫn bạn qua những gian hàng đặc sắc với hương vị miền Trung đậm đà.',
      coverImageUrl: 'https://placehold.co/1200x400?text=Tour+Sai+Gon',
      status: 'active',
      estimatedDurationMinutes: 90,
    },
  });

  const tourHoiAn = await prisma.tour.upsert({
    where: { id: 'seed-tour-hoian-001' },
    update: {},
    create: {
      id: 'seed-tour-hoian-001',
      createdBy: adminUser.id,
      name: 'Phố Cổ Hội An – Vị Ngon Trăm Năm',
      description:
        'Hòa mình vào không khí cổ kính của Hội An qua hành trình ẩm thực độc đáo. Khám phá câu chuyện đằng sau những món ăn đã làm nên danh tiếng của phố cổ di sản thế giới.',
      coverImageUrl: 'https://placehold.co/1200x400?text=Tour+Hoi+An',
      status: 'active',
      estimatedDurationMinutes: 120,
    },
  });

  console.log(`✅ Tours: "${tourHCM.name}", "${tourHoiAn.name}"`);

  // ─── 7. TourPoi ──────────────────────────────────────────────────────────────
  const approvedPois = createdPois.filter((p) => p.approvalStatus === 'approved');
  const hcmPois = approvedPois.filter((p) => p.merchantId === merchant1.id);
  const hoianPois = approvedPois.filter((p) => p.merchantId === merchant2.id);

  let tourPoiCount = 0;
  for (const [idx, poi] of hcmPois.entries()) {
    const exists = await prisma.tourPoi.findFirst({ where: { tourId: tourHCM.id, poiId: poi.id } });
    if (!exists) {
      await prisma.tourPoi.create({
        data: { tourId: tourHCM.id, poiId: poi.id, sequenceOrder: idx + 1, isMandatory: idx === 0 },
      });
      tourPoiCount++;
    }
  }
  for (const [idx, poi] of hoianPois.entries()) {
    const exists = await prisma.tourPoi.findFirst({ where: { tourId: tourHoiAn.id, poiId: poi.id } });
    if (!exists) {
      await prisma.tourPoi.create({
        data: { tourId: tourHoiAn.id, poiId: poi.id, sequenceOrder: idx + 1, isMandatory: idx === 0 },
      });
      tourPoiCount++;
    }
  }

  console.log(`✅ TourPoi: ${tourPoiCount} links`);

  // ─── 8. Sessions, GPS Tracks & Comprehensive Audio History ────────────────────────
  
  // Create multiple sessions with realistic play counts for top 10 POIs
  const sessionsData = [
    {
      userId: touristUser1.id,
      tourId: tourHCM.id,
      startedAt: new Date('2026-03-15T09:00:00Z'),
      endedAt: new Date('2026-03-15T10:30:00Z'),
      deviceInfo: 'iPhone 15 / iOS 17.4',
      appVersion: '1.0.0',
    },
    {
      userId: touristUser1.id,
      tourId: tourHCM.id,
      startedAt: new Date('2026-03-16T14:00:00Z'),
      endedAt: new Date('2026-03-16T15:45:00Z'),
      deviceInfo: 'iPhone 15 / iOS 17.4',
      appVersion: '1.0.0',
    },
    {
      userId: touristUser1.id,
      tourId: tourHoiAn.id,
      startedAt: new Date('2026-03-17T08:30:00Z'),
      endedAt: new Date('2026-03-17T11:00:00Z'),
      deviceInfo: 'iPhone 15 / iOS 17.4',
      appVersion: '1.0.0',
    },
    {
      userId: touristUser2.id,
      tourId: tourHCM.id,
      startedAt: new Date('2026-03-18T10:00:00Z'),
      endedAt: new Date('2026-03-18T11:30:00Z'),
      deviceInfo: 'Samsung S24 / Android 14',
      appVersion: '1.0.0',
    },
    {
      userId: touristUser2.id,
      tourId: tourHoiAn.id,
      startedAt: new Date('2026-03-19T09:00:00Z'),
      endedAt: new Date('2026-03-19T10:45:00Z'),
      deviceInfo: 'Samsung S24 / Android 14',
      appVersion: '1.0.0',
    },
  ];

  const createdSessions: any[] = [];
  for (const sessionData of sessionsData) {
    const existingSession = await prisma.userSession.findFirst({
      where: {
        userId: sessionData.userId,
        startedAt: sessionData.startedAt,
      },
    });
    
    if (!existingSession) {
      const session = await prisma.userSession.create({ data: sessionData as any });
      createdSessions.push(session);
    } else {
      createdSessions.push(existingSession);
    }
  }

  // Audio play history with realistic play counts for top 10 ranking
  // Top 10 by play count: create varying numbers of plays per POI
  const poiPlayCounts = [
    { poiName: 'Quầy Bánh Mì Phượng Chính Gốc', plays: 45, avgDuration: 52, completionRate: 0.92 },
    { poiName: 'Quầy Bún Bò Đặc Biệt', plays: 38, avgDuration: 48, completionRate: 0.88 },
    { poiName: 'Góc Lịch Sử Bánh Mì Hội An', plays: 35, avgDuration: 45, completionRate: 0.85 },
    { poiName: 'Góc Trưng Bày Gia Vị Truyền Thống', plays: 32, avgDuration: 42, completionRate: 0.82 },
    { poiName: 'Góc Làm Topping Bánh Mì', plays: 28, avgDuration: 40, completionRate: 0.80 },
    { poiName: 'Khu Vực Dùng Bữa & Trải Nghiệm', plays: 25, avgDuration: 38, completionRate: 0.78 },
    { poiName: 'Xưởng Làm Bánh – Trải Nghiệm Trực Tiếp', plays: 22, avgDuration: 35, completionRate: 0.75 },
    { poiName: 'Khu Vực Chế Biến Nước Dùng', plays: 20, avgDuration: 33, completionRate: 0.72 },
    { poiName: 'Khu Vực Tạo Hình Bún Huế', plays: 18, avgDuration: 30, completionRate: 0.70 },
    { poiName: 'Góc Bán Hàng & Bao Gì', plays: 15, avgDuration: 28, completionRate: 0.68 },
  ];

  let totalAudioPlays = 0;
  const baseDate = new Date('2026-03-15T09:00:00Z');

  for (const poiData of poiPlayCounts) {
    const poi = createdPois.find((p) => p.name === poiData.poiName);
    if (!poi) continue;

    for (let i = 0; i < poiData.plays; i++) {
      const sessionIndex = i % createdSessions.length;
      const session = createdSessions[sessionIndex];
      
      // Randomly vary the duration and completion
      const isCompleted = Math.random() < poiData.completionRate;
      const playDuration = isCompleted 
        ? poiData.avgDuration + Math.floor(Math.random() * 10 - 5)
        : Math.floor(poiData.avgDuration * (0.3 + Math.random() * 0.4));
      
      const triggerDate = new Date(baseDate.getTime() + i * 30 * 60 * 1000); // Every 30 minutes
      
      await prisma.audioPlayHistory.create({
        data: {
          sessionId: session.id,
          poiId: poi.id,
          triggeredAt: triggerDate,
          triggerType: 'gps',
          playDurationSeconds: playDuration,
          totalDurationSeconds: poiData.avgDuration + Math.floor(Math.random() * 10),
          completed: isCompleted,
          stopReason: isCompleted ? null : 'user_skip',
        },
      });
      totalAudioPlays++;
    }
  }

  console.log(`✅ Created ${createdSessions.length} user sessions with ${totalAudioPlays} audio plays`);

  // ─── Done ────────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed completed successfully!');
  console.log('────────────────────────────────────────────');
  console.log('  admin@audiotourguide.com  →  Admin@123456');
  console.log('  merchant1@example.com     →  Merchant@123');
  console.log('  merchant2@example.com     →  Merchant@123');
  console.log('  tourist1@example.com      →  Tourist@123');
  console.log('  tourist2@example.com      →  Tourist@123');
  console.log('────────────────────────────────────────────');
  console.log('📊 Statistics:');
  console.log(`   - ${createdPois.length} POIs created`);
  console.log(`   - ${audioCount} audio entries`);
  console.log(`   - ${createdSessions.length} user sessions`);
  console.log(`   - ${totalAudioPlays} total audio plays`);
  console.log(`   - Top 10 POIs by play count seeded`);
  console.log(`   - Top performing POIs by completion rate seeded`);
  console.log('────────────────────────────────────────────\n');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });