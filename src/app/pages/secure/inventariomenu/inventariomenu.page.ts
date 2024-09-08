import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-inventariomenu',
  templateUrl: './inventariomenu.page.html',
  styleUrls: ['./inventariomenu.page.scss'],
})
export class InventariomenuPage implements OnInit {
  currentDate: string;
  productos: any[] = [];
  productInfoVisible: { [key: number]: boolean } = {};
  idPersona: string;
  selectedDate: string;
  modalDate: string;
  isDateModalOpen = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute, // ActivatedRoute para detectar el estado
    private alertController: AlertController,
    private modalController: ModalController,
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
    this.setCurrentDate();
    this.selectedDate = this.currentDate;
    this.loadProducts();

    // Verificar si viene desde editinventario
    this.route.queryParams.subscribe((params) => {
      if (this.router.getCurrentNavigation()?.extras.state?.updated) {
        this.loadProducts(); // Recargar productos si se actualizó algo
      }
    });
  }

  setCurrentDate() {
    const today = new Date();
    const utcDate = new Date(today.getTime() + today.getTimezoneOffset() * 6000); 
    const offsetEcuador = -5 * 60; 
    const localDateEcuador = new Date(utcDate.getTime() + offsetEcuador * 60000);
    const formattedDate = localDateEcuador.toISOString().split('T')[0];
    this.currentDate = formattedDate;
  }

  loadProducts() {
    if (!this.idPersona) {
      console.error('ID de persona no disponible');
      return;
    }

    this.http.post<any>('http://localhost/ACE/WsMunicipioIonic/ws_gad.php', {
      accion: 'cargar_productos2',
      id_persona: this.idPersona,
      fecha: this.selectedDate,
    }).subscribe(
      async (response) => {
        if (response.estado) {
          this.productos = response.datos;

          if (this.productos.length === 0) {
            this.productos = [];
            const toast = await this.toastController.create({
              message: 'No se encontraron productos para la fecha seleccionada.',
              duration: 2000,
              position: 'top',
              color: 'danger'
            });
            await toast.present();
          } else {
            this.productos.forEach((producto, index) => {
              this.productInfoVisible[index] = false;
            });
          }
        } else {
          console.error('Error al cargar productos:', response.mensaje);
        }
      },
      (error) => {
        console.error('Error en la solicitud:', error);
      }
    );
  }

  toggleProductInfo(index: number) {
    this.productInfoVisible[index] = !this.productInfoVisible[index];
  }

  editarProducto(riCodigo: string, rfCodigo: string) {
    this.router.navigate(['/editinventario', { ri_codigo: riCodigo, rf_codigo: rfCodigo }]);
  }

  async eliminarProducto(riCodigo: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este producto?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Cancelado');
          },
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.http.post<any>('http://localhost/ACE/WsMunicipioIonic/ws_gad.php', {
              accion: 'eliminar',
              RI_CODIGO: riCodigo,
            }).subscribe(
              (response) => {
                if (response.estado) {
                  this.loadProducts(); // Recargar productos después de eliminar
                } else {
                  console.error('Error al eliminar producto:', response.mensaje);
                }
              },
              (error) => {
                console.error('Error en la solicitud:', error);
              }
            );
          },
        },
      ],
    });

    await alert.present();
  }

  openDateModal() {
    this.modalDate = this.selectedDate;
    this.isDateModalOpen = true;
  }

  async saveDate() {
    this.isDateModalOpen = false;
    this.selectedDate = this.modalDate;

    this.productos = [];
    this.productInfoVisible = {};

    this.loadProducts();
  }

  closeDateModal() {
    this.isDateModalOpen = false;
  }

  onDateModalDismiss() {
    this.closeDateModal();
  }

  filterProductos(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.productos = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(searchTerm)
    );
  }
}
