import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-inventario-registro',
  templateUrl: 'inventarioregistro.page.html',
  styleUrls: ['inventarioregistro.page.scss'],
})
export class InventarioregistroPage implements OnInit {
  productId: string;
  initialQuantity: number;
  date: string;
  selectedPvp: string;
  costo_distribucion: string;
  tipoPrecio: string;
  productos: any[] = [];
  initialRecordId: number;
  idPersona: string;
  isDateModalOpen = false;


  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private storage: Storage
  ) {
    this.init();
  }

  private async init() {
    await this.storage.create();
  }

  async ngOnInit() {
    this.idPersona = await this.storage.get('codigo');
    this.loadProducts();
    this.setCurrentDate();
  }

  loadProducts() {
    this.http.post<any>('http://localhost/ACE/WsMunicipioIonic/ws_gad.php', {
      accion: 'cargar_productos',
      id_persona: this.idPersona
    }).subscribe(
      response => {
        if (response.estado) {
          this.productos = response.datos;
        }
      },
      error => console.error('Error en la solicitud:', error)
    );
  }

  setCurrentDate() {
    const ecuadorDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Guayaquil',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    this.date = ecuadorDate;
  }

  openDateModal() {
    this.isDateModalOpen = true;
  }

  closeDateModal() {
    this.isDateModalOpen = false;
  }

  onDateModalDismiss(event: any) {
    const selectedDate = event.detail?.value;
    if (selectedDate) {
      this.date = selectedDate.split('T')[0]; 
    } else {
      console.log("Modal cerrado sin seleccionar fecha");
    }
    this.closeDateModal(); 
  }

  confirmDate(selectedDate: string) {
    this.date = selectedDate.split('T')[0];
    this.closeDateModal();
  }

  onProductChange(event: any) {
    this.productId = event.detail.value;
    const product = this.productos.find(p => p.id === this.productId);
    if (product) {
      this.selectedPvp = product.pvp;
      this.costo_distribucion = product.costo_distribucion;
      //this.loadInitialQuantity(this.productId);
    }
  }
  onPriceTypeChange(event: any) {
    this.tipoPrecio = event.detail.value;
    this.loadInitialQuantity(this.productId);  // Aquí se carga la cantidad inicial del producto
  }
  
  

  loadInitialQuantity(productId: string) {
    this.http.post<any>('http://localhost/ACE/WsMunicipioIonic/ws_gad.php', {
      accion: 'obtener_cantidad_inicial',
      producto_id: productId,
      tipo_precio: this.tipoPrecio
    }).subscribe(
      response => {
        if (response.estado) {
          this.initialQuantity = response.cantidad_inicial;
        }
      },
      error => console.error('Error en la solicitud:', error)
    );
  }

  saveProduct() {
    const datos = {
      accion: 'guardar_inventario',
      producto_id: this.productId,
      cantidad_inicial: this.initialQuantity,
      fecha_registro: this.date,
      tipo_precio: this.tipoPrecio,
    };

    this.http.post<any>('http://localhost/ACE/WsMunicipioIonic/ws_gad.php', datos)
      .subscribe(
        async response => {
          if (response.estado) {
            await this.showToast('Producto guardado exitosamente.', 'success');
            this.router.navigate(['/inventariomenu']).then(() => {
              window.location.reload();
            });
          } else {
            await this.showToast(response.mensaje, 'warning');
          }
        },
        error => console.error('Error en la solicitud:', error)
      );
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color,
    });
    toast.present();
  }
}
