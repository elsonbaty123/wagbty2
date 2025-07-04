
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, Loader2, User as UserIcon, Circle, Trash2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PasswordChangeForm } from '@/components/password-change-form';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { User } from '@/lib/types';
import { useNotifications } from '@/context/notification-context';
import { useOrders } from '@/context/order-context';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CHEF_AVATAR, DEFAULT_CUSTOMER_AVATAR, deliveryZones } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
    const { t, i18n } = useTranslation();
    const { user, loading, logout, updateUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { createNotification } = useNotifications();
    const { getOrdersByChefId } = useOrders();

    // Common state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    // Customer-specific state
    const [address, setAddress] = useState('');
    const [deliveryZone, setDeliveryZone] = useState('');

    // Chef-specific state
    const [specialty, setSpecialty] = useState('');
    const [bio, setBio] = useState('');
    
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (user) {
            setName(user.name);
            setEmail(user.email);
            setPhone(user.phone || '');
            setImagePreview(user.imageUrl || null);
            if (user.role === 'customer') {
                setAddress(user.address || '');
                setDeliveryZone(user.deliveryZone || '');
            }
            if (user.role === 'chef') {
                setSpecialty(user.specialty || '');
                setBio(user.bio || '');
            }
        }
    }, [user, loading, router]);
    
    if (loading || !user) {
        return (
            <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
                <Skeleton className="h-12 w-48 mb-8" />
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }
    
    const validateEmail = (email: string): string => {
        if (!email.trim()) return t('validation_email_required');
    
        if (!/^[a-zA-Z]/.test(email)) {
          return t('validation_email_must_start_with_letter');
        }
    
        if (!email.includes('@')) {
            return t('validation_email_must_contain_at');
        }
    
        if (/[^a-zA-Z0-9@._-]/.test(email)) {
          return t('validation_email_contains_invalid_chars');
        }
        
        const emailRegex = /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          return t('validation_email_invalid_format');
        }
        
        return '';
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleGetLocation = async () => {
        if (!navigator.geolocation) {
            toast({
                variant: "destructive",
                title: t('geolocation_not_supported', 'Geolocation is not supported by your browser.'),
                description: t('geolocation_not_supported_desc', 'Please enter your address manually.'),
            });
            return;
        }

        setIsFetchingLocation(true);
        
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            
            const { latitude, longitude } = position.coords;
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

            if (!apiKey) {
                toast({
                    variant: "destructive",
                    title: t('configuration_error', 'Configuration Error'),
                    description: t('google_maps_api_key_missing', 'Google Maps API key is missing. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local'),
                });
                const mockAddress = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
                setAddress(mockAddress);
                setIsFetchingLocation(false);
                return;
            }

            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=${i18n.language}`);
            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results.length > 0) {
                const fetchedAddress = data.results[0].formatted_address;
                setAddress(fetchedAddress);
                toast({
                    title: t('location_retrieved_successfully', 'Location retrieved successfully!'),
                });
            } else {
                toast({
                    variant: "destructive",
                    title: t('could_not_determine_address_title', 'Could not determine address'),
                    description: t('could_not_determine_address_desc', 'Failed to determine a precise address. Please try again or enter it manually.'),
                });
            }
        } catch (error: any) {
            let title = t('failed_to_get_location', 'Failed to get location');
            let description = t('failed_to_get_location_desc', 'Please ensure you have enabled location services and granted permission.');
            
            if (error.code) {
                switch(error.code) {
                    case 1:
                        description = t('geolocation_permission_denied_desc', 'Please allow location access in your browser settings to use this feature.');
                        break;
                    case 2:
                        description = t('geolocation_position_unavailable_desc', 'We could not determine your location. Please check your network connection.');
                        break;
                    case 3:
                        description = t('geolocation_timeout_desc', 'The request to get your location timed out. Please try again.');
                        break;
                }
            } else if (error instanceof Error) {
                 title = t('could_not_determine_address_title', 'Could not determine address');
                 description = t('could_not_determine_address_desc', 'Failed to determine a precise address. Please try again or enter it manually.');
            }

            toast({
                variant: "destructive",
                title: title,
                description: description,
            });
        } finally {
            setIsFetchingLocation(false);
        }
    };


    const handleRemoveImage = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const defaultAvatar = user.role === 'chef' ? DEFAULT_CHEF_AVATAR : DEFAULT_CUSTOMER_AVATAR;
            await updateUser({ imageUrl: defaultAvatar });
            setImagePreview(defaultAvatar);
            toast({
                title: t('profile_picture_removed'),
                description: t('profile_picture_restored_to_default'),
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: t('update_error'),
                description: error.message || t('update_error_desc'),
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveChanges = async () => {
        const error = validateEmail(email);
        if (error) {
            toast({
                variant: 'destructive',
                title: t('error_in_email'),
                description: error,
            });
            return;
        }

        setIsSaving(true);
        try {
            const userDetails: Partial<User> = { name, email, phone, imageUrl: imagePreview };
            if (user.role === 'customer') {
                userDetails.address = address;
                userDetails.deliveryZone = deliveryZone;
            }
            if (user.role === 'chef') {
                userDetails.specialty = specialty;
                userDetails.bio = bio;
            }

            await updateUser(userDetails);
            toast({
                title: t('profile_updated'),
                description: t('profile_updated_desc'),
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: t('update_error'),
                description: error.message || t('update_error_desc'),
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = async (newStatus: User['availabilityStatus']) => {
        if (!user) return;
        
        const oldStatus = user.availabilityStatus;
        await updateUser({ availabilityStatus: newStatus });
        toast({ title: t("availability_status_updated") });

        if (oldStatus === 'busy' && newStatus === 'available') {
            const queuedOrders = getOrdersByChefId(user.id).filter(o => o.status === 'waiting_for_chef');
            if (queuedOrders.length > 0) {
                createNotification({
                    recipientId: user.id,
                    titleKey: 'you_have_pending_orders',
                    messageKey: 'pending_orders_desc',
                    params: { count: queuedOrders.length },
                    link: '/chef/orders',
                });
            }
        }
    };
    
    const statusMap = {
        available: { labelKey: 'status_available', color: 'bg-green-500' },
        busy: { labelKey: 'status_busy', color: 'bg-yellow-500' },
        closed: { labelKey: 'status_closed', color: 'bg-red-500' },
    };
    
    const defaultAvatar = user.role === 'chef' ? DEFAULT_CHEF_AVATAR : DEFAULT_CUSTOMER_AVATAR;

    return (
        <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-primary mb-8">{t('account_settings')}</h1>
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('profile')}</CardTitle>
                        <CardDescription>{t('profile_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 text-left rtl:text-right">
                            <Label>{t('profile_picture')}</Label>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={imagePreview || defaultAvatar} alt={user.name} data-ai-hint="person avatar" />
                                    <AvatarFallback><UserIcon className="h-8 w-8" /></AvatarFallback>
                                </Avatar>
                                <Input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                <Label htmlFor="image-upload" className={cn(buttonVariants({ variant: 'outline' }), 'cursor-pointer')}>
                                    <Upload className="me-2 h-4 w-4" />
                                    <span>{t('change_picture')}</span>
                                </Label>
                                {imagePreview && imagePreview !== defaultAvatar && (
                                    <Button variant="ghost" size="icon" onClick={handleRemoveImage} disabled={isSaving} aria-label={t('remove_picture')}>
                                        <Trash2 className="h-5 w-5 text-destructive" />
                                        <span className="sr-only">{t('remove_picture')}</span>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {user.role === 'chef' && (
                             <div className="space-y-2 text-left rtl:text-right">
                                <Label>{t('availability_status')}</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-start">
                                            <Circle className={`me-2 h-3 w-3 flex-shrink-0 fill-current ${statusMap[user.availabilityStatus || 'available'].color}`} />
                                            <span>{t(statusMap[user.availabilityStatus || 'available'].labelKey)}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuItem onClick={() => handleStatusChange('available')}>
                                            <Circle className="me-2 h-3 w-3 flex-shrink-0 fill-current bg-green-500" />
                                            <span>{t('status_available')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange('busy')}>
                                            <Circle className="me-2 h-3 w-3 flex-shrink-0 fill-current bg-yellow-500" />
                                            <span>{t('status_busy')}</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusChange('closed')}>
                                            <Circle className="me-2 h-3 w-3 flex-shrink-0 fill-current bg-red-500" />
                                            <span>{t('status_closed')}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 text-left rtl:text-right">
                                <Label htmlFor="name">{t('full_name_label')}</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('full_name_placeholder')} />
                            </div>
                            <div className="space-y-2 text-left rtl:text-right">
                                <Label htmlFor="email">{t('email_label')}</Label>
                                <Input 
                                    id="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    placeholder={t('email_placeholder')}
                                />
                            </div>
                        </div>
                        <div className="space-y-2 text-left rtl:text-right">
                            <Label htmlFor="phone">{t('phone_number_label')}</Label>
                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('phone_placeholder')} />
                        </div>
                        {user.role === 'customer' && (
                            <>
                                <div className="space-y-2 text-left rtl:text-right">
                                    <Label htmlFor="delivery-zone">{t('delivery_zone_label', 'Delivery Zone')}</Label>
                                    <Select onValueChange={setDeliveryZone} value={deliveryZone}>
                                      <SelectTrigger id="delivery-zone" className="w-full">
                                        <SelectValue placeholder={t('select_delivery_zone_placeholder', 'Select your delivery zone')} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {deliveryZones.map((zone) => (
                                          <SelectItem key={zone.name} value={zone.name}>{t(zone.name, zone.name)}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2 text-left rtl:text-right">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="address">{t('delivery_address_label')}</Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleGetLocation}
                                            disabled={isFetchingLocation}
                                        >
                                            {isFetchingLocation ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <MapPin className="me-2 h-4 w-4" />}
                                            {t('use_current_location', 'Use Current Location')}
                                        </Button>
                                    </div>
                                    <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('delivery_address_placeholder')} />
                                </div>
                            </>
                        )}
                        {user.role === 'chef' && (
                            <>
                                <div className="space-y-2 text-left rtl:text-right">
                                    <Label htmlFor="chef-specialty">{t('kitchen_specialty_label')}</Label>
                                    <Input id="chef-specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder={t('kitchen_specialty_placeholder_alt')} />
                                </div>
                                <div className="space-y-2 text-left rtl:text-right">
                                    <Label htmlFor="chef-bio">{t('bio_label')}</Label>
                                    <Textarea id="chef-bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('bio_placeholder')} />
                                </div>
                            </>
                        )}
                        <div className="flex justify-start gap-2 pt-4 border-t">
                            <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                                {isSaving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
                                {t('save_changes')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                <PasswordChangeForm />
                 <Card className="mt-6 border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive">{t('logout')}</CardTitle>
                        <CardDescription>{t('logout_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button variant="destructive" onClick={logout}>{t('logout')}</Button>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
